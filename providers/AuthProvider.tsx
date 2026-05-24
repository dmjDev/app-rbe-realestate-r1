"use client";

import { auth } from "@/lib/auth/auth";
import { createContext, useContext, useEffect, useState } from "react";

type AuthSession = typeof auth.$Infer.Session;

// Definimos qué funciones y datos expone el Provider
interface DataContextType {
  userSession: AuthSession | null;
  dato: number;
  setDato: React.Dispatch<React.SetStateAction<number>>;
}

const AuthContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ 
  children, 
  userSession 
}: { 
  children: React.ReactNode, 
  userSession: AuthSession | null; 
}) => {
  // MANIPULAMOS LOS DATOS QUE QUEREMOS EXPONER A LOS COMPONENTES HIJOS
  // console.log('session', userSession)
  // Ejemplo de estado que podríamos manejar en el Provider
  const [dato, setDato] = useState(0);

  useEffect(() => {
    console.log('Dato actualizado:', dato);
  }, [dato])
  

  return (
    // Proveemos los datos a los componentes hijos a través del Context
    // podemos proveer funciones para actualizar el estado o cualquier dato que queramos compartir
    // podemos tener múltiples estados y funciones aquí, y los componentes hijos podrán acceder a ellos
    // pasamos más de un dato, función o estado separandolos por comas dentro del value del Provider
    <AuthContext.Provider value={{ userSession, dato, setDato }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usarlo en tus componentes
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de DataProvider");
  return context;
};
