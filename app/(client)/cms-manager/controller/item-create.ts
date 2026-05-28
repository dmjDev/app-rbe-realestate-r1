"use server";

import prisma from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { MyFormValues } from "../schemas/formInterface";
import {
  OperationType,
  PropertyType,
  EnergyRating,
  Orientation,
  FlooringType,
  FrequencyPay,
} from "@/app/generated/prisma/enums";

// Función de utilidad para limpiar números
const parseNumber = (value: number | string | null | undefined) => {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = parseFloat(value as string);
  return isNaN(parsed) ? null : parsed;
};
const parsePrice = (
  value: number | string | null | undefined,
): number | null => {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = typeof value === "number" ? value : parseFloat(value);
  if (isNaN(parsed) || parsed === 0) return null;
  return parsed;
};

export async function createItemWithProperty(
  data: MyFormValues,
  userId: string,
) {
  try {
    // Usamos una transacción para que ambos inserts sean atómicos
    const result = await prisma.$transaction(
      async (tx) => {
        // 1. Primer Insert en "items"
        const newItem = await tx.items.create({
          data: {
            managerId: userId,
            itemName: data.itemName,
            itemDescription: data.itemDescription,
            itemRef: data.itemRef,
          },
        });

        // 2. Segundo Insert en "properties" usando el ID obtenido
        await tx.property.create({
          data: {
            itemId: newItem.id,
            isOwner: data.isOwner,
            operType: data.operType as OperationType,
            propType: data.propType as PropertyType,
            price: parsePrice(data.price),
            priceMin: data?.priceMin || null,
            frequencyPay: (data.frequencyPay as FrequencyPay) || null,
            isNewDevelopment: data.isNewDevelopment,
            builtYear: data?.builtYear || null,
            province: data.province,
            municipality: data.municipality,
            neighborhood: data.neighborhood,
            streetName: data.streetName,
            streetNumber: data.streetNumber,
            floor: data.floor,
            isExterior: data.isExterior,
            showAddress: data.showAddress,
            orientation: (data.orientation as Orientation) || null,
            latitude: data.latitude ? parseNumber(data.latitude) : null,
            longitude: data.longitude ? parseNumber(data.longitude) : null,
            builtSize: data.builtSize ? parseNumber(data.builtSize) : null,
            usefulSize: data.usefulSize ? parseNumber(data.usefulSize) : null,
            rooms:
              data.rooms !== null && data.rooms !== undefined
                ? parseInt(String(data.rooms))
                : null,
            bathrooms:
              data.bathrooms !== null && data.bathrooms !== undefined
                ? parseInt(String(data.bathrooms))
                : null,
            flooringMaterial: (data.flooringMaterial as FlooringType) || null,

            // Características (booleanos)
            hasLift: data.features?.hasLift,
            hasGarden: data.features?.hasGarden,
            hasPool: data.features?.hasPool,
            hasTerrace: data.features?.hasTerrace,
            hasBalcony: data.features?.hasBalcony,
            hasStorageRoom: data.features?.hasStorageRoom,
            hasGarage: data.features?.hasGarage,
            isFurnished: data.features?.isFurnished,
            floatingFloor: data.features?.floatingFloor,
            centralHeating: data.features?.centralHeating,
            underfloorHeating: data.features?.underfloorHeating,
            ductedAirc: data.features?.ductedAirc,
            splitsAirc: data.features?.splitsAirc,
            climalitWindow: data.features?.climalitWindow,
            thermalBridgeWindow: data.features?.thermalBridgeWindow,
            electricBlinds: data.features?.electricBlinds,
            premiumAppliance: data.features?.premiumAppliance,
            seaSight: data.features?.seaSight,
            mountainSight: data.features?.mountainSight,
            culturalSight: data.features?.culturalSight,
            commonRooms: data.features?.commonRooms,
            commonPool: data.features?.commonPool,
            commonGym: data.features?.commonGym,
            padelArea: data.features?.padelArea,
            childrenArea: data.features?.childrenArea,
            socialArea: data.features?.socialArea,
            goalkeeper: data.features?.goalkeeper,
            securityCameras: data.features?.securityCameras,
            alarm: data.features?.alarm,
            accesibility: data.features?.accesibility,

            energyRating: (data.energyRating as EnergyRating) || "PENDING",
            emissionsRating:
              (data.emissionsRating as EnergyRating) || "PENDING",
            imgUrl:
              typeof data.imgUrl === "string"
                ? JSON.parse(data.imgUrl)
                : data.imgUrl,
            videoUrl: data.videoUrl,
            virtualTourUrl: data.virtualTourUrl,
            communityCosts: data.communityCosts
              ? parseNumber(data.communityCosts)
              : null,
            annualTax: data.annualTax ? parseNumber(data.annualTax) : null,
          },
        });

        return newItem;
      },
      {
        timeout: 15000, // 15 segundos para realizar la doble transacción
      },
    );

    revalidateTag("properties", "max");
    revalidatePath("/cms-manager");
    revalidatePath("/properties");

    return { success: true, data: result };
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return {
        success: false,
        error: `Reference ${data.itemRef} exists, try again with a different one.`,
      };
    }
    return { success: false, error: "Server error" };
  }
}

export async function updateItemWithProperty(
  itemId: string,
  data: MyFormValues,
) {
  try {
    const updatedItem = await prisma.items.update({
      where: {
        id: itemId,
      },
      data: {
        // 1. Campos de la tabla 'Items' (Están en la raíz de 'data')
        itemName: data.itemName,
        itemDescription: data.itemDescription,
        itemRef: data.itemRef,
        active: data.active,

        // 2. Actualización de la relación 'Property' (iprops)
        iprops: {
          update: {
            isOwner: data.isOwner,
            operType: data.operType as OperationType,
            propType: data.propType as PropertyType,
            price: parsePrice(data.price),
            priceMin: data?.priceMin || null,
            frequencyPay: (data.frequencyPay as FrequencyPay) || null,
            isNewDevelopment: data.isNewDevelopment,
            builtYear: data?.builtYear || null,
            province: data.province,
            municipality: data.municipality,
            neighborhood: data.neighborhood,
            streetName: data.streetName,
            streetNumber: data.streetNumber,
            floor: data.floor,
            isExterior: data.isExterior,
            showAddress: data.showAddress,
            orientation: (data.orientation as Orientation) || null,
            latitude: data.latitude ? parseNumber(data.latitude) : null,
            longitude: data.longitude ? parseNumber(data.longitude) : null,
            builtSize: data.builtSize ? parseNumber(data.builtSize) : null,
            usefulSize: data.usefulSize ? parseNumber(data.usefulSize) : null,
            rooms:
              data.rooms !== null && data.rooms !== undefined
                ? parseInt(String(data.rooms))
                : null,
            bathrooms:
              data.bathrooms !== null && data.bathrooms !== undefined
                ? parseInt(String(data.bathrooms))
                : null,
            flooringMaterial: (data.flooringMaterial as FlooringType) || null,
            energyRating: (data.energyRating as EnergyRating) || null,
            emissionsRating: (data.emissionsRating as EnergyRating) || null,
            communityCosts: data.communityCosts
              ? parseNumber(data.communityCosts)
              : null,
            annualTax: data.annualTax ? parseNumber(data.annualTax) : null,

            imgUrl: data.imgUrl,
            videoUrl: data.videoUrl,
            virtualTourUrl: data.virtualTourUrl,
            // 3. Características (Features)
            // En 'data' vienen dentro de un objeto 'features' asi que hacemos spread de él:
            ...data.features,
          },
        },
      },
    });

    revalidateTag("properties", "max");
    revalidatePath("/properties");

    return { success: true, data: updatedItem };
  } catch (error) {
    console.error("Error en updateItemWithProperty:", error);
    return { success: false, error: "Update Item Server error" };
  }
}
