import { auth } from "@/lib/auth/auth";
import AuthClientPage from "./AuthClientPage";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

// TESTING: Simulamos una carga lenta y un error aleatorio para probar los componentes de carga y error en la aplicación
// const wait3Seconds = () => new Promise((resolve) => setTimeout(resolve, 3000));
// function getRandomNumber(): number {
//   return Math.floor(Math.random() * 100);
// }

export default async function AuthPage() {
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
  if (session) redirect("/");

  return <AuthClientPage />;
}
