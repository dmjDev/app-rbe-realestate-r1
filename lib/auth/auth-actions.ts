"use server"

import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export const signUp = async (email: string, password: string, name: string) => {
  const result = await auth.api.signUpEmail({
    body: {
      email,
      password,
      name,
      callbackURL: "/auth",
      // urlSearch: "",
    },
    headers: await headers()
  })

  console.log('signUp')
  // Si el usuario se creó, solicitamos el envío del código OTP
  if (result.user) {
    console.log('User created, sending verification OTP');
    await auth.api.sendVerificationOTP({
      body: {
        email,
        type: "email-verification"
      }
    });
  }

  return result;
}
// VERIFICACIÓN OTP DEL LADO DEL SERVIDOR [VERIFICATION OTP] para validar el código desde el servidor
export const verifyOTP = async (email: string, otp: string) => {
  try {
    const result = await auth.api.verifyEmailOTP({
      body: {
        email,
        otp,
      },
      headers: await headers(),
    });
    return { success: true, data: result };
  } catch (error: unknown) {
// 1. Comprobamos si es un objeto válido que contiene las propiedades que buscas
    if (typeof error === "object" && error !== null) {
      // Forzamos un tipado record intermedio que ESLint acepta perfectamente para lectura segura
      const err = error as Record<string, unknown>;

      return {
        error: true,
        // Si tiene status y es número lo usa, si no, por defecto 500
        status: typeof err.status === "number" ? err.status : 500,
        // Si tiene message lo usa, si no, un string genérico
        message: typeof err.message === "string" ? err.message : "Error en la autenticación",
        // Si tiene code lo usa, si no, cae en un fallback
        code: typeof err.code === "string" ? err.code : "AUTH_ERROR"
      };
    }

    // 2. Fallback extremo si lo capturado no es un objeto
    return {
      error: true,
      status: 500,
      message: "Ha ocurrido un error inesperado",
      code: "UNKNOWN_ERROR",
    };
  }
}

export const signInSocial = async (provider: "github" | "google") => {
  const { url } = await auth.api.signInSocial({
    body: {
      provider,
      // callbackURL: "/",
      // El proxy detectará esto y creará la browser_session (PROXI.TS)
      // GENERAMOS UNA COOKIE PARA QUE AL INCIAR DE NUEVO LA APP AL ABRIR EL NAVEGADOR LA DETECTE POR SI SE QUEDÓ UNA SESION ABIERTA Y ASI CERRARLA
      callbackURL: "/?fresh_login=true",
    }
  })

  if (url) {
    redirect(url);
  }
}

export const signOut = async () => {
  await auth.api.signOut({ headers: await headers() })
}

export async function checkEmailExists(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
      select: { id: true } // Solo seleccionamos el ID por eficiencia
    })

    return !!user // Retorna true si existe, false si no
  } catch (error) {
    console.error("Error al verificar email:", error)
    throw new Error("Server error during email access")
  }
}

export const updateUserRol = async (userId: string, newRol: number) => {
  try {
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        userRol: newRol,
      },
    });

    return { success: true, data: updatedUser };
  } catch (error) {
    console.error("updateUserRol error:", error);
    return { success: false, error: "Internal server error upgrading plan" };
  }
};
