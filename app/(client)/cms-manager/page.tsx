import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { inRange } from "lodash";
import { Prisma } from "@/app/generated/prisma/client";
import prisma from "@/lib/prisma";
import { FormComponent } from "./components/FormComponent";
import type { PropertyFullDetail } from "./schemas/formInterface";

export default async function ManagerPage({
  searchParams,
}: {
  searchParams: Promise<{ itemId?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !inRange(session.user.userRol, 10, 100)) redirect("/auth");
  let { itemId } = await searchParams;
  if (!itemId) {
    itemId = "";
  }
  // console.log('itemId', itemId);

  type ItemWithIprops = Prisma.ItemsGetPayload<{
    include: { iprops: true };
  }>;
  let propertieData: ItemWithIprops | null = null;

  if (itemId) {
    // CONSULTA DB DATOS POR id
    propertieData = await prisma.items.findUnique({
      where: { id: itemId },
      include: {
        iprops: true,
      },
    });
  }
  const typedData = propertieData as unknown as PropertyFullDetail;
  // console.log('typedData', typedData)

  const tsxml = (
    <div className="bgprimary txtprimary items-center border-0 overflow-y-auto">
      <main className="ancho-global py-2">
        <div className="text-left">
          <FormComponent session={session} propertieData={typedData} />
        </div>
      </main>
    </div>
  );

  return tsxml;
}
