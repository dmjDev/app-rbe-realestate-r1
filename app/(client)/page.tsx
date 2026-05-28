import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import Link from "next/link";

import SearchForm from "./properties/components/SearchForm";
import RandSearch from "./properties/components/RandSearch";
import HomePromos from "@/components/HomePromos";
import HomeDesign from "@/components/HomeDesign";

// TESTING: Simulamos una carga lenta y un error aleatorio para probar los componentes de carga y error en la aplicación
// const wait3Seconds = () => new Promise((resolve) => setTimeout(resolve, 3000));
// function getRandomNumber(): number {
//   return Math.floor(Math.random() * 100);
// }

export default async function Home() {
  // TESTING: Simulamos una carga lenta y un error aleatorio para probar los componentes de carga y error en la aplicación
  // await wait3Seconds(); // Forzamos una espera de 3 segundos para simular una carga lenta
  // // Forzamos un error aleatorio para probar el manejo de errores en la aplicación
  // const randomNumber = getRandomNumber(); // Genera un entero entre 0 y 99
  // const isEven = randomNumber % 2 === 0; // Comprueba si el resto es 0 (par)
  // console.log(isEven);
  // if (isEven) {
  //   throw new Error("We encountered an unexpected and serious error");
  // }

  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user.id || "";
  let urlSearch = "";
  if (session) {
    console.log("session", session);
    urlSearch = session.user.urlSearch ?? "";
  }

  const tsxl_home = (
    <div className="bgprimary txtprimary flex flex-col items-center border-0 overflow-y-auto">
      {/* Hero Section */}
      <main className="ancho-global">
        <HomeDesign />

        <section className="text-center my-10">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {userId === "" && (
              <Link href="/auth" className="basebutton appbutton">
                Claim your space
              </Link>
            )}
            <RandSearch />
          </div>
        </section>

        <HomePromos userId={userId} />

        {/* Search Section */}
        <section
          id="search"
          className="txtsecondary mt-10 rounded-2xl shadow-xl bgsecondaryborder"
        >
          <div className="text-center my-4">
            <h2 className="txtprimary md:text-3xl text-2xl font-bold px-2">
              Choose your heart&apos;s desire
            </h2>
            <p className="text-lg txtsecondaryfaded px-2">
              We are here to assist you in the pursuit of your dreams
            </p>
          </div>
          <div className="form-main">
            <SearchForm userId={userId} initialUrl={urlSearch} />
          </div>
        </section>
      </main>
    </div>
  );

  return tsxl_home;
}
