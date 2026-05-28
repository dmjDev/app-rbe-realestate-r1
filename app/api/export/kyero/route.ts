import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";
import { PropertyItem } from "@/app/(client)/properties/controller/properties-controller";
import { Prisma } from "@/app/generated/prisma/browser";

export async function GET(req: NextRequest) {
  // CAPA DE SEGURIDAD: Validación por Token Secreto
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const secretToken = process.env.FEED_SECRET;

  if (!token || token !== secretToken) {
    return new NextResponse("Access Denied: Invalid or missing token", {
      status: 403,
    });
  }
  // -------------------------------------------------------------

  const urlBase = process.env.BETTER_AUTH_URL;

  const itemsQuery = {
    where: { active: true },
    include: { iprops: true },
  } satisfies Prisma.ItemsFindManyArgs;
  type ItemWithIprops = Prisma.ItemsGetPayload<typeof itemsQuery>;

  const getProperties = async () => {
    try {
      const items: ItemWithIprops[] = await prisma.items.findMany(itemsQuery);

      const rootUploads = path.join(process.cwd(), "upload");

      // OBTENEMOS LOS DATOS DE FORMA ASINCRONA
      return await Promise.all(
        items.map(async (item) => {
          const itemIdStr = String(item.id);
          const itemDir = path.join(rootUploads, itemIdStr);
          let foundImages: string[] = [];

          try {
            await fs.access(itemDir);
            const files = await fs.readdir(itemDir);

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
              .map((file) => `${urlBase}/api/images?path=${itemIdStr}/${file}`);
          } catch {
            // ERROR LA CARPETA NO EXISTE
          }

          if (item.iprops?.imgUrl && Array.isArray(item.iprops.imgUrl)) {
            const imagesArray = item.iprops.imgUrl as Array<{ url: string }>;
            const addUrls = imagesArray.map((obj) => obj.url);
            foundImages = [...foundImages, ...addUrls];
          }

          return {
            itemId: itemIdStr,
            itemName: item.itemName,
            itemDescription: item.itemDescription,
            itemRef: item.itemRef,
            active: item.active,
            operType: item.iprops?.operType ?? null,
            propType: item.iprops?.propType ?? null,
            updatedAt: item.iprops?.updatedAt ?? null,
            price: item.iprops?.price ?? null,
            frequencyPay: item.iprops?.frequencyPay ?? null,
            isNewDevelopment: item.iprops?.isNewDevelopment ?? false,
            municipality: item.iprops?.municipality ?? "",
            province: item.iprops?.province ?? "",
            floor: item.iprops?.floor ?? "",
            orientation: item.iprops?.orientation ?? null,
            latitude: item.iprops?.latitude ?? null,
            longitude: item.iprops?.longitude ?? null,
            builtSize: item.iprops?.builtSize ?? null,
            rooms: item.iprops?.rooms ?? null,
            bathrooms: item.iprops?.bathrooms ?? null,
            hasLift: item.iprops?.hasLift ?? false,
            hasGarden: item.iprops?.hasGarden ?? false,
            hasGarage: item.iprops?.hasGarage ?? false,
            hasPool: item.iprops?.hasPool ?? false,
            centralHeating: item.iprops?.centralHeating ?? false,
            energyRating: item.iprops?.energyRating ?? "PENDING",
            imgUrl: item.iprops?.imgUrl ?? null,
            videoUrl: item.iprops?.videoUrl ?? null,
            virtualTourUrl: item.iprops?.virtualTourUrl ?? null,
            imagePaths: foundImages,
          } as PropertyItem;
        }),
      );
    } catch (error) {
      console.error("Error en Kyero getProperties:", error);
      return [];
    }
  };

  const properties = await getProperties();

  // Construir el XML
  const xmlItems = properties
    .map(
      (p) => `
    <property>
      <id>${p.itemId}</id>
      <date>${p.updatedAt ? p.updatedAt.toISOString() : new Date().toISOString()}</date>
      <ref>${p.itemRef}</ref>
      <price>${p.price}</price>
      <type>${p.propType}</type>
      <town>${p.municipality}</town>
      <province>${p.province}</province>
      <location>
        <latitude>${p.latitude}</latitude>
        <longitude>${p.longitude}</longitude>
      </location>
      <images>
        ${p.imagePaths
          .map(
            (img, index) => `
          <image id="${index}">
            <url><![CDATA[${img}]]></url>
          </image>`,
          )
          .join("")}
      </images>
      <desc>
        <es><![CDATA[${p.itemDescription}]]></es>
        <en><![CDATA[${p.itemDescription}]]></en>
      </desc>
    </property>`,
    )
    .join("");

  const xmlFull = `<?xml version="1.0" encoding="UTF-8"?>
<kyero>
  <feed_version>3</feed_version>
  ${xmlItems}
</kyero>`;

  return new NextResponse(xmlFull, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}

// La URL ahora requiere llave: Para consumir el XML, tú le pasarás a Kyero o Idealista la URL estructurada de este modo: https://tudominio.com/api/kyero-feed?token=MiClaveSuperSecreta123. Si la competencia entra sin el ?token=..., se encuentra un muro 403 Access Denied.

// Uso de <![CDATA[ ... ]]>: Le he añadido etiquetas CDATA a las URLs de las imágenes y las descripciones. ¿Por qué? Porque tus URLs de imágenes contienen caracteres como el & (del parámetro &v=...). En XML, un ampersand suelto rompe el estándar y los portales te rechazarán el archivo por dar "Error de parseo XML". El CDATA le dice al lector: "Esto es texto plano, no te rompas".

// Alto rendimiento con Promise.all y map asíncrono: Al mutar de la versión Sync a la nativa asíncrona, Next.js puede procesar la lectura de carpetas de 50 inmuebles en paralelo en lugar de hacerlo uno por uno, reduciendo el tiempo de respuesta de la API drásticamente.
