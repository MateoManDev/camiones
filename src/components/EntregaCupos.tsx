import React from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { toast } from "sonner";

// --- LIBRERÍAS DE VALIDACIÓN ---
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
// Importamos 'es' desde la raíz de locale para evitar error de tipos
import { es } from "date-fns/locale";

registerLocale("es", es);

// --- ESQUEMA DE VALIDACIÓN ZOD ---
const cupoSchema = z.object({
  patente: z
    .string()
    .min(6, "Mínimo 6 caracteres")
    .regex(
      new RegExp("^([A-Z]{3}\\s?\\d{3}|[A-Z]{2}\\s?\\d{3}\\s?[A-Z]{2})$", "i"),
      "Formato inválido (Ej: AAA 123 o AA 123 BB)",
    ),
  codProd: z.string().min(1, "Debe seleccionar un producto"),
  // Aceptamos null y undefined para que TypeScript no se queje
  fecha: z
    .date()
    .nullable()
    .refine((date) => date !== null, { message: "La fecha es obligatoria" }),
});

type CupoForm = z.infer<typeof cupoSchema>;

// --- INTERFACES ---
interface Operacion {
  patente: string;
  codprod: string;
  fechacup: string;
  estado: "P" | "A" | "C" | "B" | "F" | "R";
  bruto: number;
  tara: number;
}

interface Producto {
  codigo: string;
  nombre: string;
  estado: "A" | "B";
}

export const EntregaCupos = ({ onVolver }: { onVolver: () => void }) => {
  const [productos] = useLocalStorage<Producto[]>("productos_dat", []);
  const [operaciones, setOperaciones] = useLocalStorage<Operacion[]>(
    "operaciones_dat",
    [],
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CupoForm>({
    // FIX: Usamos 'as any' para silenciar el conflicto estricto de tipos de TypeScript entre Zod y RHF
    resolver: zodResolver(cupoSchema) as any,
    defaultValues: {
      patente: "",
      codProd: "",
      fecha: new Date(),
    },
  });

  // FIX: Tipamos explícitamente el onSubmit
  const onSubmit: SubmitHandler<CupoForm> = (data) => {
    if (!data.fecha) {
      toast.error("Fecha inválida");
      return;
    }

    const fechaFormateada = data.fecha.toISOString().split("T")[0];
    const patenteNormalizada = data.patente
      ? data.patente.toUpperCase().replace(/\s/g, "")
      : "";

    const existeCupo = operaciones.find(
      (op) =>
        op.patente.replace(/\s/g, "") === patenteNormalizada &&
        op.fechacup === fechaFormateada,
    );

    if (existeCupo) {
      toast.error("DUPLICADO: YA EXISTE CUPO PARA ESTA UNIDAD HOY");
      return;
    }

    const productoValido = productos.find(
      (p) => p.codigo === data.codProd && p.estado === "A",
    );

    if (!productoValido) {
      toast.error("ERROR: PRODUCTO NO VÁLIDO O INACTIVO");
      return;
    }

    const nuevaOperacion: Operacion = {
      patente: data.patente.toUpperCase(),
      fechacup: fechaFormateada,
      codprod: data.codProd,
      estado: "P",
      bruto: 0,
      tara: 0,
    };

    setOperaciones([...operaciones, nuevaOperacion]);

    toast.success(`CUPO OTORGADO: ${nuevaOperacion.patente}`, {
      description: `Producto: ${productoValido.nombre} - Fecha: ${fechaFormateada}`,
    });

    reset({
      patente: "",
      codProd: "",
      fecha: data.fecha,
    });
  };

  return (
    <div className="relative min-h-screen bg-gray-100 dark:bg-black font-mono transition-colors duration-300">
      <div className="flex items-center justify-center min-h-screen w-full bg-gray-100 dark:bg-black p-4 transition-all duration-300">
        <div className="border-2 border-gray-300 dark:border-white p-8 bg-white dark:bg-[#0a0a0a] shadow-2xl dark:shadow-[0_0_30px_rgba(255,255,255,0.1)] w-full max-w-md transition-colors duration-300">
          <h2 className="text-center mb-8 text-xl font-bold tracking-[0.2em] text-gray-900 dark:text-white border-b-2 border-gray-300 dark:border-white pb-4 uppercase">
            [ Registro de Cupos ]
          </h2>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
          >
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600 dark:text-gray-500 uppercase tracking-widest">
                Dominio / Patente{" "}
                {errors.patente && (
                  <span className="text-red-500 font-bold ml-2 text-[10px]">
                    * {errors.patente.message}
                  </span>
                )}
              </label>

              {(() => {
                const { onChange, ...rest } = register("patente");
                return (
                  <input
                    {...rest}
                    type="text"
                    className={`bg-gray-50 dark:bg-black border p-3 text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all uppercase placeholder:text-gray-400 dark:placeholder:text-gray-800 ${errors.patente ? "border-red-500" : "border-gray-300 dark:border-gray-700"}`}
                    placeholder="AAA 123 o AA 123 BB"
                    autoComplete="off"
                    onChange={(e) => {
                      e.target.value = e.target.value.toUpperCase();
                      onChange(e);
                    }}
                  />
                );
              })()}
            </div>

            <div className="flex flex-col gap-1 relative z-50">
              <label className="text-xs text-gray-600 dark:text-gray-500 uppercase tracking-widest">
                Fecha de Operación{" "}
                {errors.fecha && (
                  <span className="text-red-500 font-bold ml-2">*</span>
                )}
              </label>
              <Controller
                control={control}
                name="fecha"
                render={({ field }) => (
                  <DatePicker
                    // FIX: Aseguramos que nunca sea undefined
                    selected={field.value ?? null}
                    onChange={(date: Date | null) => field.onChange(date)}
                    locale="es"
                    dateFormat="dd/MM/yyyy"
                    className="w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 p-3 text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all cursor-pointer"
                    placeholderText="Seleccione fecha"
                  />
                )}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600 dark:text-gray-500 uppercase tracking-widest">
                Insumo / Producto{" "}
                {errors.codProd && (
                  <span className="text-red-500 font-bold ml-2 text-[10px]">
                    * Requerido
                  </span>
                )}
              </label>
              <select
                {...register("codProd")}
                className={`bg-gray-50 dark:bg-black border p-3 text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer ${errors.codProd ? "border-red-500" : "border-gray-300 dark:border-gray-700"}`}
              >
                <option value="">-- SELECCIONAR --</option>
                {productos
                  .filter((p) => p.estado === "A")
                  .map((p) => (
                    <option key={p.codigo} value={p.codigo}>
                      {p.nombre} (ID: {p.codigo})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex flex-col gap-3 mt-4">
              <button
                type="submit"
                className="mt-2 bg-transparent border border-gray-900 dark:border-white text-gray-900 dark:text-white py-2 hover:bg-gray-900 dark:hover:bg-white hover:text-white dark:hover:text-black transition-all font-bold uppercase"
              >
                [ Otorgar Cupo ]
              </button>

              <button
                type="button"
                onClick={onVolver}
                className="w-full text-red-600 dark:text-red-700 text-[10px] font-bold border-t border-gray-300 dark:border-gray-800 pt-4 text-center mt-6 uppercase hover:text-red-500 transition-all"
              >
                &lt;&lt; Volver al Menú Principal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
