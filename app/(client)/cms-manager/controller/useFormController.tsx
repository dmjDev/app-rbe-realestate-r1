import { useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  MyFormValues,
  formSchema,
  PropertyFullDetail,
} from "../schemas/formInterface";
import {
  OperationType,
  PropertyType,
  EnergyRating,
  Orientation,
  FlooringType,
  FrequencyPay,
} from "@/app/generated/prisma/enums";
import { Prisma } from "@/app/generated/prisma/client";
import { useFileController } from "../controller/useFileController";
import { useCallback, useEffect, useRef } from "react";
import { auth } from "@/lib/auth/auth";
import { createItemWithProperty, updateItemWithProperty } from "./item-create";
import { useRouter } from "next/navigation";

// FORWARDREF FILEPLOADER
import { FileComponentHandle } from "../components/FileComponent";
// --------------------------------------
// FORWARDREF VIDEOUPLOADER
import { VideoComponentHandle } from "../components/VideoComponent";
// --------------------------------------

type FileControllerType = ReturnType<typeof useFileController>;
type ItemWithIprops = Prisma.ItemsGetPayload<{
  include: { iprops: true };
}>;

export const FEATURE_LIST = [
  "hasLift",
  "hasGarden",
  "hasPool",
  "hasTerrace",
  "hasBalcony",
  "hasStorageRoom",
  "hasGarage",
  "isFurnished",
  "floatingFloor",
  "centralHeating",
  "underfloorHeating",
  "ductedAirc",
  "splitsAirc",
  "climalitWindow",
  "thermalBridgeWindow",
  "electricBlinds",
  "premiumAppliance",
  "seaSight",
  "mountainSight",
  "culturalSight",
  "commonRooms",
  "commonPool",
  "commonGym",
  "padelArea",
  "childrenArea",
  "socialArea",
  "goalkeeper",
  "securityCameras",
  "alarm",
  "accesibility",
] as const;
const initialFeatures = FEATURE_LIST.reduce(
  (acc, feat) => {
    acc[feat] = false;
    return acc;
  },
  {} as Record<(typeof FEATURE_LIST)[number], boolean>,
);
// 1. Definimos los tipos de forma explícita para evitar que TS se queje de los Enums
const INITIAL_FORM_VALUES: MyFormValues = {
  itemName: "",
  itemDescription: "",
  itemRef: "",
  active: true,
  isOwner: false,
  isNewDevelopment: false,
  builtYear: null as number | null, // Usamos 'null' y lo casteamos a unión de tipos permitida

  // Precio: usando null en lugar de 0
  price: null as number | null,
  priceMin: null as number | null,

  // Enums: casteamos el "" al tipo (Enum | "") que permite tu esquema
  operType: "" as OperationType | "",
  propType: "" as PropertyType | "",
  frequencyPay: "" as FrequencyPay | "",
  orientation: "" as Orientation | "",
  flooringMaterial: "" as FlooringType | "",
  energyRating: "" as EnergyRating | "",
  emissionsRating: "" as EnergyRating | "",

  // ... resto de campos
  province: "",
  municipality: "",
  neighborhood: "",
  streetName: "",
  streetNumber: "",
  floor: "",
  isExterior: true,
  showAddress: false,
  latitude: null as number | null,
  longitude: null as number | null,
  builtSize: null as number | null,
  usefulSize: null as number | null,
  rooms: null as number | null,
  bathrooms: null as number | null,
  communityCosts: null as number | null,
  annualTax: null as number | null,
  imgUrl: [],
  imgUrlAdd: "",
  videoUrl: "",
  virtualTourUrl: "",
  features: initialFeatures,
};

type Session = typeof auth.$Infer.Session;
export const useFormController = (
  session: Session,
  error: string,
  setError: React.Dispatch<React.SetStateAction<string>>,
  setSuccess: React.Dispatch<React.SetStateAction<string>>,
  setErrorRef: React.Dispatch<React.SetStateAction<string>>,
  setSuccessRef: React.Dispatch<React.SetStateAction<string>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  fileController: FileControllerType,
  propertieData: ItemWithIprops | null,
  VideoRef: React.RefObject<VideoComponentHandle | null>,
  FilesRef: React.RefObject<FileComponentHandle | null>,
) => {
  const router = useRouter();

  // SETTERS y EL PRIMER USEEFFECT ENCIERRAN A LOS SETTERS EN UN REF PARA EVITAR QUE SE REINICIEN CON CADA RENDERIZADO, PERMITIENDO ASÍ SU USO EN EL SEGUNDO USEEFFECT DE INICIALIZACIÓN SIN PROBLEMAS DE DEPENDENCIAS
  const setters = useRef({ setError, setSuccess, setErrorRef, setSuccessRef });
  useEffect(() => {
    setters.current = { setError, setSuccess, setErrorRef, setSuccessRef };
  });

  // HANDLESUBMIT PROXIS
  // Proxies para esconder los refs al linter de React
  const videoRefProxy =
    useRef<React.RefObject<VideoComponentHandle | null>>(VideoRef);
  const filesRefProxy =
    useRef<React.RefObject<FileComponentHandle | null>>(FilesRef);
  // 2. ACTUALIZA los proxies en un useEffect.
  // Esto es seguro porque ocurre post-render.
  useEffect(() => {
    videoRefProxy.current = VideoRef;
    filesRefProxy.current = FilesRef;
  }, [VideoRef, FilesRef]);

  useEffect(() => {
    if (!sessionStorage.getItem("itemForm_started")) {
      const { setError, setSuccess, setErrorRef, setSuccessRef } =
        setters.current;

      setError(`Error message checked !`);
      setSuccess(`Success message checked !`);
      setErrorRef(`Error message checked !`);
      setSuccessRef(`Success message checked !`);

      setTimeout(() => {
        setError("");
        setSuccess("");
        setErrorRef("");
        setSuccessRef("");
      }, 5000);

      sessionStorage.setItem("itemForm_started", "true");
    }
  }, []);

  // CARGA DE DATOS POR DEFECTO PARA LOS CAMPOS DEL FORMULARIO
  const mapDataToForm = (data: PropertyFullDetail): MyFormValues => {
    const p = data?.iprops;

    return {
      itemName: data?.itemName || "",
      itemDescription: data?.itemDescription || "",
      itemRef: data?.itemRef || "",
      active: data?.active,
      isOwner: p?.isOwner,

      // Campos de la tabla Property
      price: p?.price || null, // null
      priceMin: p?.priceMin || null, // null ---
      isNewDevelopment: p?.isNewDevelopment,
      builtYear: p?.builtYear || null, // null
      province: p?.province || "",
      municipality: p?.municipality || "",
      neighborhood: p?.neighborhood || "",
      streetName: p?.streetName || "",
      streetNumber: p?.streetNumber || "",
      floor: p?.floor || "",
      isExterior: p?.isExterior,
      showAddress: p?.showAddress,
      latitude: p?.latitude || null, //null
      longitude: p?.longitude || null, //null
      builtSize: p?.builtSize || null, //null ---
      usefulSize: p?.usefulSize || null, //null ---
      rooms: p?.rooms || null, //null ---
      bathrooms: p?.bathrooms || null, //null ---
      communityCosts: p?.communityCosts || null, //null ---
      annualTax: p?.annualTax || null, //null

      // Enums (TS validará que coincidan con MyFormValues)
      operType: p?.operType || undefined, //as OperationType,
      propType: p?.propType || undefined, //as PropertyType,
      orientation: p?.orientation || undefined,
      energyRating: p?.energyRating || undefined,
      emissionsRating: p?.emissionsRating || undefined,
      flooringMaterial: p?.flooringMaterial || undefined,
      frequencyPay: p?.frequencyPay || undefined,

      // Multimedia
      imgUrl: Array.isArray(p?.imgUrl) ? p.imgUrl : [],
      imgUrlAdd: "",
      videoUrl: p?.videoUrl || "",
      virtualTourUrl: p?.virtualTourUrl || "",

      // Mapeo automático de booleanos (Features)
      features: FEATURE_LIST.reduce(
        (acc, feat) => ({
          ...acc,
          [feat]: !!p?.[feat],
        }),
        {},
      ),
    } as MyFormValues;
  };
  const formattedData = propertieData
    ? mapDataToForm(propertieData as PropertyFullDetail)
    : undefined;
  // console.log('formattedData', formattedData)

  const methods = useForm<MyFormValues>({
    resolver: zodResolver(formSchema) as Resolver<MyFormValues>,
    mode: "onChange",
    defaultValues: formattedData || INITIAL_FORM_VALUES,
  });

  useEffect(() => {
    if (propertieData && propertieData !== null) {
      methods.reset(mapDataToForm(propertieData as PropertyFullDetail));
    } else {
      methods.reset(
        {
          ...INITIAL_FORM_VALUES,
        },
        {
          keepDefaultValues: false,
          keepDirtyValues: false,
          keepValues: false,
        },
      );
      if (VideoRef.current?.hasFile) VideoRef.current.reset();
      if (FilesRef.current?.hasFiles) FilesRef.current.reset();
    }
  }, [propertieData, methods, VideoRef, FilesRef]);
  // -------------------------------------------------------------------------------------------------

  // Handler para el form CREATE Y UPDATE
  // Función de utilidad para limpiar números
  const parseNumber = (value: number | string | null | undefined) => {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = parseFloat(value as string);
    return isNaN(parsed) ? null : parsed;
  };

  const onValid = useCallback(
    async (data: MyFormValues) => {
      setIsLoading(true);
      setError("");
      setSuccess("");

      // Acceso seguro a través de los proxies
      const videoInstance = videoRefProxy.current.current;

      const managerId = session.user.id;
      let localSuccess = "";
      let localError = "";

      const cleanedData = {
        ...data,
        price: data.price ? parseNumber(data.price) : null,
        priceMin: data.priceMin ? parseNumber(data.priceMin) : null,
        builtSize: data.builtSize
          ? parseNumber(data.builtSize.toFixed(0))
          : null,
        usefulSize: data.usefulSize
          ? parseNumber(data.usefulSize.toFixed(0))
          : null,
        rooms:
          data.rooms !== null && data.rooms !== undefined
            ? parseInt(String(data.rooms))
            : null,
        bathrooms:
          data.bathrooms !== null && data.bathrooms !== undefined
            ? parseInt(String(data.bathrooms))
            : null,
        communityCosts: data.communityCosts
          ? parseNumber(data.communityCosts)
          : null,
        latitude: data.latitude ? parseNumber(data.latitude) : null,
        longitude: data.longitude ? parseNumber(data.longitude) : null,
      };

      try {
        const response = propertieData
          ? await updateItemWithProperty(propertieData.id, cleanedData)
          : await createItemWithProperty(cleanedData, managerId);

        if (!response.error) {
          const itemId = propertieData
            ? propertieData.id
            : (response.data?.id as string);

          if (itemId) {
            // FILEUPLOADER
            const fileRes = await fileController.uploadAllFiles(itemId);
            if (fileRes.success) {
              localSuccess = fileRes.message;
            } else {
              localError = fileRes.error;
            }

            if (!propertieData) fileController.setAllImages([]);

            // VIDEOUPLOADER (usando la instancia segura)
            if (videoInstance?.hasFile) {
              const vSucc = await videoInstance.uploadVideo(itemId);
              localSuccess = vSucc
                ? `${localSuccess}\nVideo uploaded successfully`
                : `${localError}\nError saving video`;
            } else {
              localSuccess += "\nNo video to upload";
            }

            if (videoInstance?.isDeleted) {
              const vDel = await videoInstance.deleteVideo(itemId);
              localSuccess = vDel
                ? `${localSuccess}\nVideo deleted successfully`
                : `${localError}\nError deleting video`;
              videoInstance.reset();
            }
          }

          localSuccess += "\nThe information has been successfully updated";

          [
            "pending_urls",
            "last_id_results",
            "last_prov_results",
            "last_search_results",
            "last_scroll_pos",
          ].forEach((key) => sessionStorage.removeItem(key));

          setSuccess(localSuccess);
          setError(localError);
        } else {
          setError(response.error as string);
        }

        if (!propertieData) {
          methods.reset(INITIAL_FORM_VALUES, {
            keepDefaultValues: false,
            keepDirtyValues: false,
            keepValues: false,
          });
          if (localError === "") router.refresh();
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (e: unknown) {
        if (e instanceof Error) setError(e.message);
        else if (typeof e === "string") setError(e);
        else setError("Server error");
      } finally {
        setIsLoading(false);
      }
    },
    [
      session.user.id,
      propertieData,
      fileController,
      methods,
      router,
      setError,
      setSuccess,
      setIsLoading,
    ],
  );

  // Ref estable para onValid — rompe la cadena que ESLint detecta como "acceso a ref durante render"
  const onValidRef = useRef<(data: MyFormValues) => Promise<void>>(onValid);
  useEffect(() => {
    onValidRef.current = onValid;
  }, [onValid]);

  // Wrapper estable con deps vacías — accede al ref solo en el momento del submit (evento), nunca en render
  const stableOnValid = useCallback(
    (data: MyFormValues) => onValidRef.current(data),
    [], // intencionalmente vacío: onValidRef.current siempre está actualizado por el useEffect
  );

  // handleSubmitForm ya no expone refs al render
  const handleSubmitForm = useCallback(
    (e?: React.BaseSyntheticEvent) => methods.handleSubmit(stableOnValid)(e),
    [methods, stableOnValid],
  );

  const newFormAction = () => {
    methods.reset();

    if (VideoRef.current?.hasFile) VideoRef.current.reset();
    if (FilesRef.current?.hasFiles) FilesRef.current.reset();

    setError("");
    setSuccess("");
    setErrorRef("");
    setSuccessRef("");

    if ("pending_urls" in sessionStorage) {
      sessionStorage.removeItem("pending_urls");
    }
    if ("last_id_results" in sessionStorage) {
      sessionStorage.removeItem("last_id_results");
    }
    if ("last_prov_results" in sessionStorage) {
      sessionStorage.removeItem("last_prov_results");
    }
    if ("last_search_results" in sessionStorage) {
      sessionStorage.removeItem("last_search_results");
    }
    if ("last_scroll_pos" in sessionStorage) {
      sessionStorage.removeItem("last_scroll_pos");
    }

    router.refresh();
    router.push("/cms-manager");

    window.scrollTo({
      top: 0,
      behavior: "smooth", // 'smooth' para desplazamiento suave, 'instant' para salto inmediato
    });
  };

  return {
    methods,
    FEATURE_LIST,
    handleSubmitForm,
    newFormAction,
  };
};
