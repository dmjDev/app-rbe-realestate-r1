"use client";

import { createContext, useContext, useEffect, useState } from "react";

// Definimos qué funciones y datos expone el Provider
interface DataContextType {
  dato: number;
  setDato: React.Dispatch<React.SetStateAction<number>>;
}
const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  // MANIPULAMOS LOS DATOS QUE QUEREMOS EXPONER A LOS COMPONENTES HIJOS
  // console.log('session', userSession)
  // Ejemplo de estado que podríamos manejar en el Provider
  const [dato, setDato] = useState(0);

  useEffect(() => {
    console.log("Dato actualizado:", dato);
  }, [dato]);

  return (
    // Proveemos los datos a los componentes hijos a través del Context
    // podemos proveer funciones para actualizar el estado o cualquier dato que queramos compartir
    // podemos tener múltiples estados y funciones aquí, y los componentes hijos podrán acceder a ellos
    // pasamos más de un dato, función o estado separandolos por comas dentro del value del Provider
    <DataContext.Provider value={{ dato, setDato }}>
      {children}
    </DataContext.Provider>
  );
};

// Hook para usarlo en tus componentes
export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData debe usarse dentro de DataProvider");
  return context;
};
