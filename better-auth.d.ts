import "better-auth";

declare module "better-auth" {
  // Esto añade el campo a la tabla de usuarios interna
  interface User {
    userRol: number;
  }
  
  // Esto asegura que también esté disponible en el objeto de sesión de los plugins
  interface SessionUser extends User {
    userRol: number;
  }
}