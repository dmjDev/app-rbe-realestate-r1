import {
  getFilteredProperties,
  getFilteredCount,
  getUserIdProperties,
  getUserIdCount,
  getProvProperties,
  getProvCount,
  PropertyItem,
} from "./controller/properties-controller";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { PropertyInfiniteList } from "./components/PropertyInfiniteList";
import { Prisma } from "@/app/generated/prisma/client";
import { OrderConfig } from "./controller/properties-controller";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PropertiesPage({ searchParams }: PageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user.id || "";
  const resolvedSearchParams = await searchParams;
  // console.log('params', resolvedSearchParams)

  let initialProperties = [] as PropertyItem[];
  let totalCount = 0;
  let edit = false; // VISTA O NO DEL BOTON EDITAR EN EL CARRUSEL
  let mode = ""; // según esta variable ejecutamos una de las opciones en fetchMoreProperties

  const itemsPage = 8; // ITEMS QUE SE CARGARAN CADA VEZ DURANTE ES SCROLL INFINITO

  // ORDER BY DINAMICO
  const order: OrderConfig = {
    key:
      (resolvedSearchParams.sort as
        | keyof Prisma.ItemsOrderByWithRelationInput
        | keyof Prisma.PropertyOrderByWithRelationInput) || "price", //price, builtSize, updatedAt, itemRef
    vector: (resolvedSearchParams.dir as Prisma.SortOrder) || "asc", //asc, desc
  };

  const paramUserIdTrue: boolean =
    String(resolvedSearchParams.userId).toLowerCase() === "true";
  if (
    (resolvedSearchParams.userId && !paramUserIdTrue) ||
    (resolvedSearchParams.userId && !session)
  ) {
    return (
      <main className="bgprimary">
        <div className="ancho-global">
          <p className="text-center text-lg mt-10">
            A user ID has not been specified to display its properties
          </p>
        </div>
      </main>
    );
  }
  if (paramUserIdTrue) {
    console.log("entra en ID");
    edit = true;
    mode = "ID";
    [initialProperties, totalCount] = await Promise.all([
      getUserIdProperties(userId, 0, itemsPage, order),
      getUserIdCount(userId),
    ]);
  } else if (resolvedSearchParams.prov) {
    mode = "PROV";
    [initialProperties, totalCount] = await Promise.all([
      getProvProperties(resolvedSearchParams, 0, itemsPage, order),
      getProvCount(resolvedSearchParams),
    ]);
  } else {
    mode = "FILTER";
    [initialProperties, totalCount] = await Promise.all([
      getFilteredProperties(resolvedSearchParams, 0, itemsPage, order),
      getFilteredCount(resolvedSearchParams),
    ]);
  }

  // console.log('return', mode, totalCount, initialProperties.length, initialProperties)
  const tsxml = (
    <main className="bgprimary">
      <div className="ancho-global">
        <PropertyInfiniteList
          initialItems={initialProperties}
          searchParams={resolvedSearchParams}
          userId={userId}
          totalCount={totalCount}
          edit={edit}
          itemsPage={itemsPage}
          mode={mode}
          order={order}
        />
      </div>
    </main>
  );

  return tsxml;
}
