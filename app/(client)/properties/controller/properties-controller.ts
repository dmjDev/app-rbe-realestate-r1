"use server";

import prisma from "@/lib/prisma";
import { revalidatePath, unstable_cache } from "next/cache";
import fs from "fs";
import path from "path";
import { getBoundingBox } from "./getBoundigBox";
import {
  OperationType,
  Prisma,
  PropertyType,
} from "@/app/generated/prisma/client";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";

// PARA PROPERTYDETAILS.TSX
type ItemWithProps = Prisma.ItemsGetPayload<{ include: { iprops: true } }>;
type IProps = NonNullable<ItemWithProps["iprops"]>;

export type FlatPropertyData = Omit<
  ItemWithProps,
  "iprops" | "id" | "createdAt" | "updatedAt"
> &
  Omit<IProps, "id" | "createdAt" | "updatedAt" | "itemId"> & {
    id: string;
    createdAt: string | undefined;
    updatedAt: string | undefined;
    ipropId: string | undefined;
    ipropCreatedAt: string | undefined;
    ipropUpdatedAt: string | undefined;
  };

export interface PropertyItem {
  itemId: string;
  itemName: string;
  itemDescription: string;
  itemRef: string;
  active: boolean;
  isavedId?: string;
  isavedState?: string;
  operType: string;
  propType: string;
  updatedAt: Date;
  price: number;
  frequencyPay: string | null;
  isNewDevelopment?: boolean | null;
  address?: string | null;
  municipality: string;
  province: string;
  floor?: string | null;
  orientation?: string | null;
  latitude: number | null;
  longitude: number | null;
  builtSize?: number | null;
  rooms?: number | null;
  bathrooms?: number | null;
  hasLift?: boolean | null;
  hasGarden?: boolean | null;
  hasGarage?: boolean | null;
  hasPool?: boolean | null;
  centralHeating?: boolean | null;
  energyRating?: string | null;
  imgUrl?: string | null;
  videoUrl?: string | null;
  virtualTourUrl?: string | null;
  imagePaths: string[];
}

export interface OrderConfig {
  key:
    | keyof Prisma.ItemsOrderByWithRelationInput
    | keyof Prisma.PropertyOrderByWithRelationInput;
  vector: Prisma.SortOrder; // Solo permite 'asc' o 'desc'
}

type ItemWithIprops = Prisma.ItemsGetPayload<{
  include: { iprops: true };
}>;

const cacheTime = 3600;

const getSession = async () => {
  return await auth.api.getSession({ headers: await headers() });
};

type SearchParams = { [key: string]: string | string[] | undefined };
const param = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? (value[0] ?? "") : (value ?? "");

// BUSQUEDA POR PROVINCES SEARCHREFFORM
export const getProvCount = async (params: SearchParams) => {
  const searchKey = JSON.stringify(params);

  const getCount = unstable_cache(
    async (_q: string) => {
      try {
        const total = await prisma.items.count({
          where: {
            active: true,
            iprops: {
              province: params.prov as string,
            },
          },
        });

        return total;
      } catch (error) {
        console.error("Error en getProvCount:", error);
        return 0;
      }
    },
    ["properties-prov-count"],
    { revalidate: cacheTime, tags: ["properties"] },
  );

  return getCount(searchKey);
};

export const getProvProperties = async (
  params: SearchParams,
  skip: number,
  take: number,
  order: OrderConfig,
): Promise<PropertyItem[]> => {
  // Envolvemos la lógica en la función cacheada
  const cacheFetch = unstable_cache(
    async (
      PROV: string,
      s: number,
      t: number,
      ordKey: string,
      ordVec: string,
    ) => {
      const isPropertyKey = ["price", "builtSize", "updatedAt"].includes(
        ordKey,
      ); // en Items -> itemRef
      try {
        const items = await prisma.items.findMany({
          where: {
            active: true,
            iprops: {
              province: PROV,
            },
          },
          include: { iprops: true },
          orderBy: isPropertyKey
            ? { iprops: { [ordKey]: ordVec } } // Ordena por la relación
            : ({ [ordKey]: ordVec } as Prisma.ItemsOrderByWithRelationInput), // Ordena por la tabla principal
          skip: s,
          take: t,
        });

        const rootUploads = path.join(process.cwd(), "upload");

        return items.map((item: ItemWithIprops) => {
          const itemIdStr = String(item.id);
          const itemDir = path.join(rootUploads, itemIdStr);
          let foundImages: string[] = [];

          if (fs.existsSync(itemDir)) {
            const files = fs.readdirSync(itemDir);
            foundImages = files
              .filter(
                (file) =>
                  file.startsWith(`${itemIdStr}_`) && file.endsWith(".webp"),
              )
              .sort((a, b) => {
                const numA = parseInt(a.split("_")[1] || "0");
                const numB = parseInt(b.split("_")[1] || "0");
                return numA - numB;
              })
              .map(
                (file) =>
                  `/api/images?path=${itemIdStr}/${file}&v=${Date.now()}`,
              ); //&media=false`);
          }

          if (item.iprops?.imgUrl && Array.isArray(item.iprops.imgUrl)) {
            const imagesArray = item.iprops.imgUrl as Array<{ url: string }>;
            const addUrls = imagesArray.map((obj) => obj.url);
            foundImages = [...foundImages, ...addUrls];
          }

          let address = "Address not available";
          const parts: string[] = [];
          if (item.iprops?.showAddress && item.iprops.streetName !== "")
            parts.push(item.iprops.streetName || "");
          parts.push(
            item.iprops?.municipality || "",
            item.iprops?.province || "",
          );
          parts.filter(Boolean);
          if (parts.length > 0) address = parts.join(", ");

          return {
            itemId: itemIdStr,
            itemName: item.itemName,
            itemRef: item.itemRef,
            active: item.active,
            operType: item.iprops?.operType,
            propType: item.iprops?.propType,
            updatedAt: item.iprops?.updatedAt,
            price: Number(item.iprops?.price),
            frequencyPay: item.iprops?.frequencyPay,
            isNewDevelopment: item.iprops?.isNewDevelopment,
            address: address,
            floor: item.iprops?.floor,
            orientation: item.iprops?.orientation,
            latitude: item.iprops?.latitude,
            longitude: item.iprops?.longitude,
            builtSize: item.iprops?.builtSize,
            rooms: item.iprops?.rooms,
            bathrooms: item.iprops?.bathrooms,
            hasLift: item.iprops?.hasLift,
            hasGarden: item.iprops?.hasGarden,
            hasGarage: item.iprops?.hasGarage,
            hasPool: item.iprops?.hasPool,
            centralHeating: item.iprops?.centralHeating,
            energyRating: item.iprops?.energyRating,
            imgUrl: item.iprops?.imgUrl,
            videoUrl: item.iprops?.videoUrl,
            virtualTourUrl: item.iprops?.virtualTourUrl,
            imagePaths: foundImages,
          } as PropertyItem;
        });
      } catch (error) {
        console.error("Error en getProvProperties:", error);
        return [];
      }
    },
    ["properties-prov-list"], // Key base
    {
      revalidate: cacheTime,
      tags: ["properties"],
    },
  );

  const prov = Array.isArray(params.prov)
    ? params.prov[0]
    : (params.prov ?? "");

  return cacheFetch(prov, skip, take, order.key, order.vector);
};

// BUSQUEDA POR REFERENCIA SEARCHREFFORM
export const getUserIdCount = async (userId: string) => {
  const getCount = unstable_cache(
    async (uid: string) => {
      try {
        const total = await prisma.items.count({
          where: { managerId: uid },
        });

        return total;
      } catch (error) {
        console.error("Error en getUserIdCount:", error);
        return 0;
      }
    },
    ["properties-user-count"],
    { revalidate: cacheTime, tags: ["properties"] },
  );

  return getCount(userId);
};

export const getUserIdProperties = async (
  userId: string,
  skip: number,
  take: number,
  order: OrderConfig,
): Promise<PropertyItem[]> => {
  const cacheFetch = unstable_cache(
    async (
      uId: string,
      s: number,
      t: number,
      ordKey: string,
      ordVec: string,
    ) => {
      const isPropertyKey = ["price", "builtSize", "updatedAt"].includes(
        ordKey,
      ); // en Items -> itemRef
      try {
        const items = await prisma.items.findMany({
          where: { managerId: uId },
          include: { iprops: true },
          orderBy: isPropertyKey
            ? { iprops: { [ordKey]: ordVec } } // Ordena por la relación
            : ({ [ordKey]: ordVec } as Prisma.ItemsOrderByWithRelationInput), // Ordena por la tabla principal
          skip: s,
          take: t,
        });

        const rootUploads = path.join(process.cwd(), "upload");

        return items.map((item: ItemWithIprops) => {
          const itemIdStr = String(item.id);
          const itemDir = path.join(rootUploads, itemIdStr);
          let foundImages: string[] = [];

          if (fs.existsSync(itemDir)) {
            const files = fs.readdirSync(itemDir);
            foundImages = files
              .filter(
                (file) =>
                  file.startsWith(`${itemIdStr}_`) && file.endsWith(".webp"),
              )
              .sort((a, b) => {
                const numA = parseInt(a.split("_")[1] || "0");
                const numB = parseInt(b.split("_")[1] || "0");
                return numA - numB;
              })
              .map(
                (file) =>
                  `/api/images?path=${itemIdStr}/${file}&v=${Date.now()}`,
              ); //&media=false`);
          }

          if (item.iprops?.imgUrl && Array.isArray(item.iprops.imgUrl)) {
            const imagesArray = item.iprops.imgUrl as Array<{ url: string }>;
            const addUrls = imagesArray.map((obj) => obj.url);
            foundImages = [...foundImages, ...addUrls];
          }

          let address = "Address not available";
          const parts: string[] = [];
          if (item.iprops?.showAddress && item.iprops?.streetName !== "")
            parts.push(item.iprops.streetName || "");
          parts.push(
            item.iprops?.municipality || "",
            item.iprops?.province || "",
          );
          parts.filter(Boolean);
          if (parts.length > 0) address = parts.join(", ");

          return {
            itemId: itemIdStr,
            itemName: item.itemName,
            itemRef: item.itemRef,
            active: item.active,
            operType: item.iprops?.operType,
            propType: item.iprops?.propType,
            updatedAt: item.iprops?.updatedAt,
            price: Number(item.iprops?.price),
            frequencyPay: item.iprops?.frequencyPay,
            isNewDevelopment: item.iprops?.isNewDevelopment,
            address: address,
            floor: item.iprops?.floor,
            orientation: item.iprops?.orientation,
            latitude: item.iprops?.latitude,
            longitude: item.iprops?.longitude,
            builtSize: item.iprops?.builtSize,
            rooms: item.iprops?.rooms,
            bathrooms: item.iprops?.bathrooms,
            hasLift: item.iprops?.hasLift,
            hasGarden: item.iprops?.hasGarden,
            hasGarage: item.iprops?.hasGarage,
            hasPool: item.iprops?.hasPool,
            centralHeating: item.iprops?.centralHeating,
            energyRating: item.iprops?.energyRating,
            imgUrl: item.iprops?.imgUrl,
            videoUrl: item.iprops?.videoUrl,
            virtualTourUrl: item.iprops?.virtualTourUrl,
            imagePaths: foundImages,
          } as PropertyItem;
        });
      } catch (error) {
        console.error("Error en getUserIdProperties:", error);
        return [];
      }
    },
    ["properties-user-list"], // Key base
    {
      revalidate: cacheTime,
      tags: ["properties"],
    },
  );

  // IMPORTANTE: Pasamos los argumentos aquí para que formen parte de la cache key automáticamente
  return cacheFetch(userId, skip, take, order.key, order.vector);
};

// BUSQUEDA POR FILTROS -SEARCHFORM
export const getFilteredCount = async (params: SearchParams) => {
  const searchKey = JSON.stringify(params);

  const getCount = unstable_cache(
    async (_q: string) => {
      try {
        const propertyFilters: Prisma.PropertyWhereInput = {
          operType: param(params.operType)
            ? (param(params.operType) as OperationType)
            : undefined,
          propType: param(params.propType)
            ? (param(params.propType) as PropertyType)
            : undefined,
          price: {
            gte: param(params.priceMin)
              ? parseFloat(param(params.priceMin))
              : undefined,
            lte: param(params.priceMax)
              ? parseFloat(param(params.priceMax))
              : undefined,
          },
          rooms: param(params.roomsMin)
            ? { gte: parseInt(param(params.roomsMin)) }
            : undefined,
          bathrooms: param(params.bathroomsMin)
            ? { gte: parseInt(param(params.bathroomsMin)) }
            : undefined,
          builtSize: param(params.builtSizeMin)
            ? { gte: parseInt(param(params.builtSizeMin)) }
            : undefined,
          isNewDevelopment:
            param(params.isNewDevelopment) === "true" ? true : undefined,
          hasPool: param(params.hasPool) === "true" ? true : undefined,
          hasGarden: param(params.hasGarden) === "true" ? true : undefined,
          hasLift: param(params.hasLift) === "true" ? true : undefined,
          centralHeating:
            param(params.centralHeating) === "true" ? true : undefined,
          hasTerrace: param(params.hasTerrace) === "true" ? true : undefined,
          hasGarage: param(params.hasGarage) === "true" ? true : undefined,
        };

        // Lógica de ubicación idéntica a la búsqueda
        if (
          param(params.latitude) &&
          param(params.longitude) &&
          param(params.distance)
        ) {
          const box = getBoundingBox(
            param(params.latitude),
            param(params.longitude),
            param(params.distance),
          );
          propertyFilters.latitude = { gte: box.minLat, lte: box.maxLat };
          propertyFilters.longitude = { gte: box.minLon, lte: box.maxLon };
        } else {
          if (param(params.province))
            propertyFilters.province = {
              contains: param(params.province),
              mode: "insensitive",
            };
          if (param(params.municipality))
            propertyFilters.municipality = {
              contains: param(params.municipality),
              mode: "insensitive",
            };
        }

        const total = await prisma.items.count({
          where: {
            active: true,
            iprops: propertyFilters,
          },
        });

        return total;
      } catch (error) {
        console.error("Error en getFilteredCount:", error);
        return 0;
      }
    },
    ["properties-filtered-count"],
    { revalidate: cacheTime, tags: ["properties"] },
  );

  return getCount(searchKey);
};

export const getFilteredProperties = async (
  params: SearchParams,
  skip: number,
  take: number,
  order: OrderConfig,
): Promise<PropertyItem[]> => {
  const searchKey = JSON.stringify(params);

  const fetcher = unstable_cache(
    async (
      s: number,
      t: number,
      _query: string,
      ordKey: string,
      ordVec: string,
    ) => {
      const isPropertyKey = ["price", "builtSize", "updatedAt"].includes(
        ordKey,
      ); // en Items -> itemRef
      try {
        const propertyFilters: Prisma.PropertyWhereInput = {
          operType: param(params.operType)
            ? (param(params.operType) as OperationType)
            : undefined,
          propType: param(params.propType)
            ? (param(params.propType) as PropertyType)
            : undefined,
          price: {
            gte: param(params.priceMin)
              ? parseFloat(param(params.priceMin))
              : undefined,
            lte: param(params.priceMax)
              ? parseFloat(param(params.priceMax))
              : undefined,
          },
          rooms: param(params.roomsMin)
            ? { gte: parseInt(param(params.roomsMin)) }
            : undefined,
          bathrooms: param(params.bathroomsMin)
            ? { gte: parseInt(param(params.bathroomsMin)) }
            : undefined,
          builtSize: param(params.builtSizeMin)
            ? { gte: parseInt(param(params.builtSizeMin)) }
            : undefined,
          isNewDevelopment:
            param(params.isNewDevelopment) === "true" ? true : undefined,
          hasPool: param(params.hasPool) === "true" ? true : undefined,
          hasGarden: param(params.hasGarden) === "true" ? true : undefined,
          hasLift: param(params.hasLift) === "true" ? true : undefined,
          centralHeating:
            param(params.centralHeating) === "true" ? true : undefined,
          hasTerrace: param(params.hasTerrace) === "true" ? true : undefined,
          hasGarage: param(params.hasGarage) === "true" ? true : undefined,
        };

        if (
          param(params.latitude) &&
          param(params.longitude) &&
          param(params.distance)
        ) {
          const box = getBoundingBox(
            param(params.latitude),
            param(params.longitude),
            param(params.distance),
          );
          propertyFilters.latitude = { gte: box.minLat, lte: box.maxLat };
          propertyFilters.longitude = { gte: box.minLon, lte: box.maxLon };
        } else {
          if (param(params.province))
            propertyFilters.province = {
              contains: param(params.province),
              mode: "insensitive",
            };
          if (param(params.municipality))
            propertyFilters.municipality = {
              contains: param(params.municipality),
              mode: "insensitive",
            };
        }

        const items = await prisma.items.findMany({
          where: {
            active: true,
            iprops: propertyFilters,
          },
          include: { iprops: true },
          orderBy: isPropertyKey
            ? { iprops: { [ordKey]: ordVec } } // Ordena por la relación
            : ({ [ordKey]: ordVec } as Prisma.ItemsOrderByWithRelationInput), // Ordena por la tabla principal
          skip: s,
          take: t,
        });

        const rootUploads = path.join(process.cwd(), "upload");
        return items.map((item: ItemWithIprops) => {
          const itemIdStr = String(item.id);
          const itemDir = path.join(rootUploads, itemIdStr);
          let foundImages: string[] = [];

          if (fs.existsSync(itemDir)) {
            const files = fs.readdirSync(itemDir);
            foundImages = files
              .filter(
                (file) =>
                  file.startsWith(`${itemIdStr}_`) && file.endsWith(".webp"),
              )
              .sort((a, b) => {
                const numA = parseInt(a.split("_")[1] || "0");
                const numB = parseInt(b.split("_")[1] || "0");
                return numA - numB;
              })
              .map(
                (file) =>
                  `/api/images?path=${itemIdStr}/${file}&v=${Date.now()}`,
              ); //&media=false`);
          }

          if (item.iprops?.imgUrl && Array.isArray(item.iprops.imgUrl)) {
            const imagesArray = item.iprops.imgUrl as Array<{ url: string }>;
            const addUrls = imagesArray.map((obj) => obj.url);
            foundImages = [...foundImages, ...addUrls];
          }

          let address = "Address not available";
          const parts: string[] = [];
          if (item.iprops?.showAddress && item.iprops?.streetName !== "")
            parts.push(item.iprops.streetName || "");
          parts.push(
            item.iprops?.municipality || "",
            item.iprops?.province || "",
          );
          parts.filter(Boolean);
          if (parts.length > 0) address = parts.join(", ");

          return {
            itemId: itemIdStr,
            itemName: item.itemName,
            itemRef: item.itemRef,
            active: item.active,
            operType: item.iprops?.operType,
            propType: item.iprops?.propType,
            updatedAt: item.iprops?.updatedAt,
            price: Number(item.iprops?.price),
            frequencyPay: item.iprops?.frequencyPay,
            isNewDevelopment: item.iprops?.isNewDevelopment,
            address: address,
            floor: item.iprops?.floor,
            orientation: item.iprops?.orientation,
            latitude: item.iprops?.latitude,
            longitude: item.iprops?.longitude,
            builtSize: item.iprops?.builtSize,
            rooms: item.iprops?.rooms,
            bathrooms: item.iprops?.bathrooms,
            hasLift: item.iprops?.hasLift,
            hasGarden: item.iprops?.hasGarden,
            hasGarage: item.iprops?.hasGarage,
            hasPool: item.iprops?.hasPool,
            centralHeating: item.iprops?.centralHeating,
            energyRating: item.iprops?.energyRating,
            imgUrl: item.iprops?.imgUrl,
            videoUrl: item.iprops?.videoUrl,
            virtualTourUrl: item.iprops?.virtualTourUrl,
            imagePaths: foundImages,
          } as PropertyItem;
        });
      } catch (error) {
        console.error("Error en getFilteredProperties:", error);
        return [];
      }
    },
    ["properties-filtered-list"],
    { revalidate: cacheTime, tags: ["properties"] },
  );

  return fetcher(skip, take, searchKey, order.key, order.vector);
};

// Función para cargar más propiedades (paginación) desde el cliente, reutilizando la lógica de filtrado y cacheo de getFilteredProperties
export async function fetchMoreProperties(
  userId: string,
  params: SearchParams,
  skip: number,
  take: number,
  mode: string,
  order: OrderConfig,
) {
  if (mode === "ID")
    return await getUserIdProperties(userId, skip, take, order);
  if (mode === "PROV")
    return await getProvProperties(params, skip, take, order);
  if (mode === "FILTER")
    return await getFilteredProperties(params, skip, take, order);
}
// --------------------------------------------------------------------------------------------------------------

// CONSULTA A DB PARA OBTENER LOS DATOS DEL INMUEBLE SEGÚN SU REFERENCIA
export async function getPropertyByReference(ref: string) {
  const session = await getSession();
  if (!ref) return { success: false, error: "Reference is required" };
  try {
    const item = await prisma.items.findFirst({
      where: {
        itemRef: ref,
        OR: [{ managerId: session?.user.id || "" }, { active: true }],
      },
      include: {
        isaved: true,
        iprops: true,
      },
    });

    //LOGICA DE ARCHIVOS
    if (!item) return { success: false, error: "Property not found" };
    const rootUploads = path.join(process.cwd(), "upload");
    const itemIdStr = String(item.id);
    const itemDir = path.join(rootUploads, itemIdStr);
    let foundImages: string[] = [];

    if (fs.existsSync(itemDir)) {
      const files = fs.readdirSync(itemDir);
      foundImages = files
        .filter(
          (file) => file.startsWith(`${itemIdStr}_`) && file.endsWith(".webp"),
        )
        .sort((a, b) => {
          const numA = parseInt(a.split("_")[1] || "0");
          const numB = parseInt(b.split("_")[1] || "0");
          return numA - numB;
        })
        .map((file) => `/api/images?path=${itemIdStr}/${file}&v=${Date.now()}`); //&media=false`);
    }

    if (item.iprops?.imgUrl && Array.isArray(item.iprops.imgUrl)) {
      const imagesArray = item.iprops.imgUrl as Array<{ url: string }>;
      const addUrls = imagesArray.map((obj) => obj.url);
      foundImages = [...foundImages, ...addUrls];
    }
    // console.log('foundImg', foundImages)

    let address = "Address not available";
    const parts: string[] = [];
    if (item.iprops?.showAddress && item.iprops.streetName !== "")
      parts.push(item.iprops?.streetName || "");
    parts.push(item.iprops?.municipality || "", item.iprops?.province || "");
    parts.filter(Boolean);
    if (parts.length > 0) address = parts.join(", ");

    const data = {
      itemId: itemIdStr,
      itemName: item.itemName,
      itemRef: item.itemRef,
      active: item.active,

      isavedId: item.isaved[0]?.id || "",
      isavedState: item.isaved[0]?.state || "",

      operType: item.iprops?.operType,
      propType: item.iprops?.propType,
      updatedAt: item.iprops?.updatedAt,
      price: Number(item.iprops?.price),
      frequencyPay: item.iprops?.frequencyPay,
      isNewDevelopment: item.iprops?.isNewDevelopment,
      address: address,
      floor: item.iprops?.floor,
      orientation: item.iprops?.orientation,
      latitude: item.iprops?.latitude,
      longitude: item.iprops?.longitude,
      builtSize: item.iprops?.builtSize,
      rooms: item.iprops?.rooms,
      bathrooms: item.iprops?.bathrooms,
      hasLift: item.iprops?.hasLift,
      hasGarden: item.iprops?.hasGarden,
      hasGarage: item.iprops?.hasGarage,
      hasPool: item.iprops?.hasPool,
      centralHeating: item.iprops?.centralHeating,
      energyRating: item.iprops?.energyRating,
      imgUrl: item.iprops?.imgUrl,
      videoUrl: item.iprops?.videoUrl,
      virtualTourUrl: item.iprops?.virtualTourUrl,
      imagePaths: foundImages,
    } as PropertyItem;

    return {
      success: true,
      data: data,
      message: "Property found, we are ready to display it",
    };
  } catch (e) {
    console.error("getPropertyByReference Error:", e);
    return { success: false, error: "Server error" };
  }
}

export async function getRandomPropertyAction() {
  const itemCount = await prisma.items.count({
    where: {
      active: true,
    },
  });
  const skip = Math.floor(Math.random() * itemCount);

  const randItem = await prisma.items.findFirst({
    where: {
      active: true,
    },
    skip: skip,
    take: 1,
  });

  // console.log('ref RAND: ', randItem?.itemRef)
  if (!randItem?.itemRef) {
    return { success: false, error: "No items found" };
  }

  const response = await getPropertyByReference(randItem.itemRef.trim());
  return response;
}

// HOME PROMOS ALEATORIAS
const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array]; // Clonamos para no mutar el original
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // Intercambio de valores (Destructuring assignment)
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};
export async function getHomePromosProperties(limit: number) {
  try {
    const promos = await prisma.items.findMany({
      where: { homePromo: true },
      include: { iprops: true },
      take: limit,
    });

    const items = shuffleArray(promos);
    const rootUploads = path.join(process.cwd(), "upload");

    return items.map((item: ItemWithIprops) => {
      const itemIdStr = String(item.id);
      const itemDir = path.join(rootUploads, itemIdStr);
      let foundImages: string[] = [];

      if (fs.existsSync(itemDir)) {
        const files = fs.readdirSync(itemDir);
        foundImages = files
          .filter(
            (file) =>
              file.startsWith(`${itemIdStr}_`) && file.endsWith(".webp"),
          )
          .sort((a, b) => {
            const numA = parseInt(a.split("_")[1] || "0");
            const numB = parseInt(b.split("_")[1] || "0");
            return numA - numB;
          })
          .map(
            (file) => `/api/images?path=${itemIdStr}/${file}&v=${Date.now()}`,
          ); //&media=false`);
      }

      if (item.iprops?.imgUrl && Array.isArray(item.iprops.imgUrl)) {
        const imagesArray = item.iprops.imgUrl as Array<{ url: string }>;
        const addUrls = imagesArray.map((obj) => obj.url);
        foundImages = [...foundImages, ...addUrls];
      }

      let address = "Address not available";
      const parts: string[] = [];
      if (item.iprops?.showAddress && item.iprops?.streetName !== "")
        parts.push(item.iprops.streetName || "");
      parts.push(item.iprops?.municipality || "", item.iprops?.province || "");
      parts.filter(Boolean);
      if (parts.length > 0) address = parts.join(", ");

      // console.log('foundImages', foundImages)

      return {
        itemId: itemIdStr,
        itemName: item.itemName,
        itemRef: item.itemRef,
        active: item.active,
        operType: item.iprops?.operType,
        propType: item.iprops?.propType,
        updatedAt: item.iprops?.updatedAt,
        price: Number(item.iprops?.price),
        frequencyPay: item.iprops?.frequencyPay,
        isNewDevelopment: item.iprops?.isNewDevelopment,
        address: address,
        floor: item.iprops?.floor,
        orientation: item.iprops?.orientation,
        latitude: item.iprops?.latitude,
        longitude: item.iprops?.longitude,
        builtSize: item.iprops?.builtSize,
        rooms: item.iprops?.rooms,
        bathrooms: item.iprops?.bathrooms,
        hasLift: item.iprops?.hasLift,
        hasGarden: item.iprops?.hasGarden,
        hasGarage: item.iprops?.hasGarage,
        hasPool: item.iprops?.hasPool,
        centralHeating: item.iprops?.centralHeating,
        energyRating: item.iprops?.energyRating,
        imgUrl: item.iprops?.imgUrl,
        videoUrl: item.iprops?.videoUrl,
        virtualTourUrl: item.iprops?.virtualTourUrl,
        imagePaths: foundImages,
      } as PropertyItem;
    });
  } catch (error) {
    console.error("Error en getHomePromosProperties:", error);
    return [];
  }
}
// --------------------------------------------------------------------------------------

// ACTUALIZA LA URL DE BÚSQUEDA GUARDADA DEL USUARIO PARA MOSTRARLA EN LA PÁGINA DE PROPIEDADES GUARDADAS
export async function updateUserSearchUrl(url: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  try {
    await prisma.user.update({
      where: { id: session?.user.id || "" },
      data: { urlSearch: url },
    });
    revalidatePath("/");
  } catch {
    throw new Error("No se pudo guardar la búsqueda");
  }
}

// CONSULTA LOS ITEMS GUARDADOS DEL USUARIO PARA MOSTRARLOS EN LA PÁGINA DE PROPIEDADES GUARDADAS
export const getItemsSaved = async () => {
  const session = await getSession();
  return await prisma.itemsSaved.findMany({
    where: { clientId: session?.user.id || "" },
  });
};

// GUARDA O ACTUALIZA EL ESTADO DE UN ITEM GUARDADO (FAVORITO) PARA UN USUARIO, Y DEVUELVE LA LISTA ACTUALIZADA DE ITEMS GUARDADOS PARA MOSTRARLA EN LA PÁGINA DE PROPIEDADES GUARDADAS
export async function saveItem(Id: string, itemId: string, newState: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  if (Id === "") {
    const exists = await prisma.itemsSaved.findFirst({
      where: { itemId, clientId: session?.user.id || "" },
    });

    if (!exists) {
      await prisma.itemsSaved.create({
        data: { itemId, clientId: session?.user.id || "", state: newState },
      });
    } else {
      await prisma.itemsSaved.update({
        where: { id: exists.id },
        data: { state: newState },
      });
    }
  } else {
    await prisma.itemsSaved.update({
      where: { id: Id },
      data: { state: newState },
    });
  }
  return getItemsSaved();
}
