import { PropertyCard } from "@/app/(client)/properties/components/PropertyCard";
import { getHomePromosProperties } from "@/app/(client)/properties/controller/properties-controller";
import { PropertyItem } from "@/app/(client)/properties/controller/properties-controller";

export const dynamic = "force-dynamic";

const HomePromos = async ({ userId }: { userId: string }) => {
  const limit = 8;
  const promos = await getHomePromosProperties(limit);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {promos.map((item: PropertyItem) => (
        <PropertyCard
          key={item.itemId}
          item={item}
          userId={userId}
          edit={false}
        />
      ))}
    </div>
  );
};

export default HomePromos;
