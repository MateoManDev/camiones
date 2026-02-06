import React, { useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { toast } from "sonner";

// --- LIBRERÍAS DE VALIDACIÓN ---
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// --- INTERFACES ---
interface Operacion {
  patente: string;
  codprod: string;
  fechacup: string;
  estado: "P" | "A" | "C" | "B" | "F" | "R";
  bruto: number;
  tara: number;
}

interface RubroXProducto {
  codigorub: string;
  codigoprod: string;
  valmin: number;
  valmax: number;
}

interface Rubro {
  codigo: string;
  nombre: string;
}

// --- ESQUEMA DE VALIDACIÓN DINÁMICO ---
// Validamos un objeto donde las claves son strings (codigos de rubro)
// y los valores se convierten de string a número.
const calidadSchema = z.record(
  z.string(),
  z.string().min(1, "Requerido").pipe(z.coerce.number()),
);

export const RegistrarCalidad = ({ onVolver }: { onVolver: () => void }) => {
  const [operaciones, setOperaciones] = useLocalStorage<Operacion[]>(
    "operaciones_dat",
    [],
  );
  const [rxp] = useLocalStorage<RubroXProducto[]>("rubrosXproducto_dat", []);
  const [rubrosBase] = useLocalStorage<Rubro[]>("rubros_dat", []);

  const [operacionActiva, setOperacionActiva] = useState<Operacion | null>(
    null,
  );
  const [showManual, setShowManual] = useState(false);

  const hoy = new Date().toISOString().split("T")[0];

  const camionesEsperandoCalidad = operaciones.filter(
    (op) => op.fechacup === hoy && op.estado === "A",
  );

  // --- CONFIGURACIÓN DEL FORMULARIO ---
  // FIX: Usamos <any> para permitir campos dinámicos y evitar el error "type never"
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(calidadSchema),
    defaultValues: {},
  });

  const seleccionarCamion = (op: Operacion) => {
    setOperacionActiva(op);
    reset(); // Limpia valores anteriores
  };

  // --- PROCESAMIENTO (ONSUBMIT) ---
  const onCalidadSubmit: SubmitHandler<Record<string, number>> = (data) => {
    if (!operacionActiva) return;

    const rubrosDelProd = rxp.filter(
      (r) => r.codigoprod === operacionActiva.codprod,
    );

    // 1. Verificar si aprueba o rechaza
    let contRubCorr = 0;
    rubrosDelProd.forEach((r) => {
      // Zod ya convirtió el valor a número
      const valor = data[r.codigorub];
      if (valor >= r.valmin && valor <= r.valmax) {
        contRubCorr++;
      }
    });

    // Lógica de aprobación (Todos correctos o tolerancia de 1)
    const esAceptado =
      contRubCorr === rubrosDelProd.length ||
      (rubrosDelProd.length > 1 && contRubCorr === rubrosDelProd.length - 1);

    const nuevoEstado = esAceptado ? "C" : "R";

    // 2. Actualizar Operaciones
    const nuevasOperaciones = operaciones.map((op) =>
      op.patente === operacionActiva.patente && op.fechacup === hoy
        ? { ...op, estado: nuevoEstado as any }
        : op,
    );

    setOperaciones(nuevasOperaciones);

    // 3. Notificar
    if (esAceptado) {
      toast.success(`CALIDAD APROBADA: ${operacionActiva.patente}`, {
        description: "Unidad liberada para descarga (Estado: C).",
      });
    } else {
      toast.error(`CALIDAD RECHAZADA: ${operacionActiva.patente}`, {
        description: "Unidad bloqueada por no cumplir estándares (Estado: R).",
      });
    }

    // 4. Limpiar
    setOperacionActiva(null);
    reset();
  };

  return (
    <div className="relative min-h-screen bg-gray-100 dark:bg-black font-mono transition-colors duration-300">
      <div className="flex items-center justify-center min-h-screen w-full bg-gray-100 dark:bg-black p-4 transition-all duration-300">
        <div className="border-2 border-violet-600 dark:border-violet-600 p-8 bg-white dark:bg-[#0a0a0a] shadow-xl w-full max-w-md transition-colors duration-300">
          <h2 className="text-center mb-8 text-xl font-bold tracking-[0.2em] text-violet-600 dark:text-violet-500 border-b-2 border-violet-600 dark:border-violet-900 pb-4 uppercase italic">
            [ Registrar Calidad ]
          </h2>

          {!operacionActiva ? (
            // --- LISTA DE ESPERA ---
            <div className="flex flex-col gap-4">
              <label className="text-[10px] text-violet-700 dark:text-violet-500 uppercase tracking-widest font-bold">
                Unidades en Playa esperando Calada:
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {camionesEsperandoCalidad.length > 0 ? (
                  camionesEsperandoCalidad.map((op) => (
                    <button
                      key={op.patente}
                      onClick={() => seleccionarCamion(op)}
                      className="flex justify-between items-center p-3 border border-gray-300 dark:border-gray-800 bg-gray-50 dark:bg-black hover:border-violet-500 transition-all group text-left"
                    >
                      <div className="flex flex-col">
                        <span className="text-gray-900 dark:text-white font-bold">
                          {op.patente}
                        </span>
                        <span className="text-[9px] text-gray-500 uppercase">
                          {op.codprod}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold text-violet-600 dark:text-violet-500 border border-violet-200 dark:border-violet-900 px-2 py-1 uppercase group-hover:bg-violet-500 group-hover:text-white transition-colors">
                        Analizar
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 border border-dashed border-gray-300 dark:border-gray-800 text-gray-500 text-xs italic">
                    NO HAY CAMIONES ARRIBADOS PENDIENTES
                  </div>
                )}
              </div>
            </div>
          ) : (
            // --- FORMULARIO DE CALIDAD ---
            <div className="flex flex-col gap-5 animate-in slide-in-from-bottom duration-300">
              <div className="text-gray-900 dark:text-white text-[10px] border-b border-gray-300 dark:border-gray-800 pb-2 flex justify-between uppercase font-bold">
                <span>UNIDAD: {operacionActiva.patente}</span>
                <span className="text-violet-600 dark:text-violet-500">
                  PROD: {operacionActiva.codprod}
                </span>
              </div>

              <form onSubmit={handleSubmit(onCalidadSubmit)}>
                <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar mb-4">
                  {rxp
                    .filter((r) => r.codigoprod === operacionActiva.codprod)
                    .map((r, index) => {
                      const infoRubro = rubrosBase.find(
                        (rb) => rb.codigo === r.codigorub,
                      );
                      const nombreRubro = infoRubro
                        ? infoRubro.nombre
                        : r.codigorub;
                      const errorCampo = errors[r.codigorub];

                      return (
                        <div key={r.codigorub} className="flex flex-col gap-1">
                          <label className="text-[10px] text-gray-500 uppercase flex justify-between">
                            <span>{nombreRubro}</span>
                            <span className="italic text-violet-600 dark:text-violet-500">
                              RANGO: {r.valmin}-{r.valmax}
                            </span>
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            className={`bg-gray-50 dark:bg-black border p-2 text-gray-900 dark:text-white focus:border-violet-500 outline-none text-center ${errorCampo ? "border-red-500" : "border-gray-300 dark:border-gray-700"}`}
                            placeholder="-" // Placeholder visible, input inicia vacío
                            autoComplete="off"
                            // IMPORTANTE: Registramos dinámicamente con el código del rubro
                            {...register(r.codigorub)}
                            autoFocus={index === 0}
                          />
                          {errorCampo && (
                            <span className="text-[9px] text-red-500 text-right font-bold">
                              * Requerido
                            </span>
                          )}
                        </div>
                      );
                    })}
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    type="submit"
                    className="bg-transparent border border-violet-600 text-violet-600 dark:text-violet-500 py-3 hover:bg-violet-600 hover:text-white dark:hover:text-black transition-all font-bold uppercase text-sm"
                  >
                    [ GUARDAR ANÁLISIS ]
                  </button>
                  <button
                    type="button"
                    onClick={() => setOperacionActiva(null)}
                    className="text-gray-500 text-[10px] hover:text-black dark:hover:text-white uppercase text-center italic"
                  >
                    Cancelar Carga
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* MANUAL DE AYUDA */}
          <div className="mt-6 border border-gray-300 dark:border-gray-800 rounded-sm overflow-hidden font-mono">
            <button
              onClick={() => setShowManual(!showManual)}
              className="w-full bg-gray-200 dark:bg-gray-800/50 p-2 text-[10px] text-violet-700 dark:text-violet-500 flex justify-between items-center hover:bg-gray-300 dark:hover:bg-gray-800 transition-colors uppercase font-bold italic"
            >
              <span>{showManual ? "▼" : "▶"} Manual de Operaciones</span>
            </button>
            {showManual && (
              <div className="p-3 bg-gray-100 dark:bg-black/40 border border-gray-300 dark:border-gray-800 text-[9px] text-gray-600 dark:text-gray-400 space-y-3">
                <p>
                  • Los camiones aparecen aquí tras marcar el **Arribo** en
                  Recepción.
                </p>
                <p>
                  • Al completar el análisis, el camión pasa a estado{" "}
                  <b className="text-gray-900 dark:text-white">C (Calado)</b> o{" "}
                  <b className="text-red-600 dark:text-red-500">
                    R (Rechazado)
                  </b>
                  .
                </p>
              </div>
            )}
          </div>

          <button
            onClick={onVolver}
            className="w-full text-red-600 dark:text-red-700 text-[10px] font-bold border-t border-gray-300 dark:border-gray-800 pt-4 text-center mt-6 uppercase hover:text-red-500 transition-all"
          >
            &lt;&lt; Volver al Menú Principal
          </button>
        </div>
      </div>
    </div>
  );
};
