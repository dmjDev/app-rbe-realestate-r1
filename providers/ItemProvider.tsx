"use client";

import { createContext, useContext, useState } from "react";
import { ItemsSaved } from "@/app/generated/prisma/client";

// Definimos qué funciones y datos expone el Provider
interface DataContextType {
  itemsSaved: ItemsSaved[];
  updateItemStatus: (
    itemId: string,
    newState: string,
    idSaved?: string,
  ) => void;
}

const ItemContext = createContext<DataContextType | undefined>(undefined);

export const ItemProvider = ({
  children,
  initialItemsSaved,
}: {
  children: React.ReactNode;
  initialItemsSaved: ItemsSaved[];
}) => {
  // Convertimos los datos iniciales en un ESTADO de React
  const [itemsSaved, setItemsSaved] = useState<ItemsSaved[]>(initialItemsSaved);

  // Esta función es la que llamaremos desde la página de detalles
  const updateItemStatus = (
    itemId: string,
    newState: string,
    idSaved: string = "",
  ) => {
    setItemsSaved((prev) => {
      const exists = prev.find((item) => item.itemId === itemId);
      if (exists) {
        // Si ya está en la lista, actualizamos su estado (ej: de "like" a "likeVisited")
        return prev.map((item) =>
          item.itemId === itemId ? { ...item, state: newState } : item,
        );
      }
      const newItem: ItemsSaved = {
        id: idSaved,
        itemId,
        clientId: "",
        state: newState,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return [...prev, newItem];
    });
  };

  return (
    <ItemContext.Provider value={{ itemsSaved, updateItemStatus }}>
      {children}
    </ItemContext.Provider>
  );
};

// Hook para usarlo en tus componentes
export const useItems = () => {
  const context = useContext(ItemContext);
  if (!context) throw new Error("useItems debe usarse dentro de ItemProvider");
  return context;
};
