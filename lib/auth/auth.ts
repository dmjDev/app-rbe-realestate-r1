import { betterAuth, APIError } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { customSession, emailOTP } from "better-auth/plugins"; // [VERIFICATION OTP]
import prisma from "@/lib/prisma";
import nodemailer from "nodemailer"; // [VERIFICATION OTP]

// TIPADO USERROL
// Creamos una interfaz local con lo que sabemos que viene de la DB
interface UserWithRole {
  userRol: number;
}
// Creamos un Type Guard para ESLint y TypeScript
function hasUserRol(user: unknown): user is UserWithRole {
  return (
    typeof user === "object" &&
    user !== null &&
    "userRol" in user &&
    typeof (user as Record<string, unknown>).userRol === "number"
  );
}

interface UserWithUrlSearch {
  urlSearch: string | null;
}
function hasUrlSearch(user: unknown): user is UserWithUrlSearch {
  return (
    typeof user === "object" &&
    user !== null &&
    "urlSearch" in user &&
    (typeof (user as Record<string, unknown>).urlSearch === "string" ||
      (user as Record<string, unknown>).urlSearch === null)
  );
}

// Configuración de Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const ipCache = new Map<string, { count: number; lockUntil: number }>();

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  session: {
    expiresIn: 28800, // 28800 -> 8 horas en segundos
    updateAge: 3600, // Actualiza la cookie cada hora si el usuario interactúa (en segundos)
  },

  user: {
    additionalFields: {
      // Utilizamos esta propiedad de betterAuth para añadir el campo userRol a los datos por defecto de session
      userRol: {
        type: "number",
        input: false, // No se puede enviar desde el formulario de registro
      },
      urlSearch: {
        type: "string",
        input: false,
        defaultValue: null, // Opcional, por si el usuario no tiene imagen
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: false, // false -> evita que se creen los datos de sesión al registrarse o autenticarse con este método, por defecto es true
    requireEmailVerification: true, // true -> obliga a verificar el email antes de crear la sesión, por defecto es false
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  hooks: {
    before: async (ctx: { path?: string; request?: Request }) => {
      const path = ctx.path || "";
      let maxAttempts: number = 0;
      let lockDuration: number = 0;

      if (path.includes("/email-otp") || path.includes("/sign-in/email")) {
        const ip =
          ctx.request?.headers.get("x-forwarded-for") || "127.0.0.1" || "::1";
        const now = Date.now();
        const record = ipCache.get(ip) ?? { count: 0, lockUntil: 0 };

        if (record.lockUntil > now) {
          throw new APIError("TOO_MANY_REQUESTS", { status: 429 });
        }

        record.count++;
        // console.log('path', path)
        // console.log(`${ip} IP attempt: ${record.count}`);

        if (path.includes("/email-otp")) {
          maxAttempts = 3;
          lockDuration = 300000; // 5 minutos
        }
        if (path.includes("/sign-in/email")) {
          maxAttempts = 5;
          lockDuration = 60000; // 1 minuto
        }

        if (record.count > maxAttempts) {
          record.lockUntil = now + lockDuration;
          record.count = 0;
          ipCache.set(ip, record);
          throw new APIError("TOO_MANY_REQUESTS", { status: 429 });
        }
        ipCache.set(ip, record);
      }
    },
    after: createAuthMiddleware(async (ctx) => {
      // Verificamos si la ruta es de inicio de sesión y si hay una sesión nueva
      if (ctx.path.startsWith("/sign-in") && ctx.context.newSession) {
        const user = ctx.context.newSession.user;
        console.log(`¡Login exitoso para el usuario: ${user.email}!`, ipCache);
        ipCache.clear();

        // Ejemplo: Actualizar un campo 'lastLogin' en tu DB
        // await db.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
      }
    }),
  },
  plugins: [
    emailOTP({
      allowedAttempts: 3,
      expiresIn: 300, //segundos de validez del código OTP, 300 -> 5 minutos

      async sendVerificationOTP({ email, otp, type }, _request) {
        if (type === "forget-password") {
          await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: email,
            subject: "Código para restablecer contraseña",
            html: `<p>Tu código de recuperación es:</p><h1>${otp}</h1><p>Expira en 5 minutos.</p>`,
          });
        }
        if (type === "email-verification") {
          await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: email,
            subject: "Tu código de seguridad",
            html: `<h1>${otp}</h1><p>Introduce este código para activar tu cuenta.</p>`,
          });
        }
      },
    }),
    customSession(async ({ user, session }) => {
      // 1. Buscamos el rol en la DB usando el ID del rol que ya tiene el usuario
      // Usamos findUnique porque 'level' es @unique en tu esquema
      const currentRole = hasUserRol(user) ? user.userRol : 1;
      const roleData = await prisma.role.findUnique({
        where: { level: currentRole },
      });
      const currentUrlSearch = hasUrlSearch(user) ? user.urlSearch : null;

      return {
        session,
        user: {
          ...user,
          userRol: currentRole, // <--- Esto añade el campo userRol al JSON final
          roleName: roleData?.name || "Unexpected Rol", // 2. Inyectamos el nombre del rol dinámicamente
          urlSearch: currentUrlSearch,
        },
      };
    }),
    nextCookies(),
  ],
});
