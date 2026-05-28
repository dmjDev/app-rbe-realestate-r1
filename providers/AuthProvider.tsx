"use client";

import { auth } from "@/lib/auth/auth";
import { createContext, useContext } from "react";

type AuthSession = typeof auth.$Infer.Session;

// Definimos qué funciones y datos expone el Provider
interface DataContextType {
  userSession: AuthSession | null;
}

const AuthContext = createContext<DataContextType | undefined>(undefined);

export const AuthProvider = ({
  children,
  userSession,
}: {
  children: React.ReactNode;
  userSession: AuthSession | null;
}) => {
  return (
    // Proveemos los datos a los componentes hijos a través del Context
    // podemos proveer funciones para actualizar el estado o cualquier dato que queramos compartir
    // podemos tener múltiples estados y funciones aquí, y los componentes hijos podrán acceder a ellos
    // pasamos más de un dato, función o estado separandolos por comas dentro del value del Provider
    <AuthContext.Provider value={{ userSession }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usarlo en tus componentes
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
};
