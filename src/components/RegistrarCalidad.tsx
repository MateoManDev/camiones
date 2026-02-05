import React, { useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
// 1. IMPORTAR SONNER
import { toast } from "sonner";

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
  const [valoresCalidad, setValoresCalidad] = useState<{
    [key: string]: string;
  }>({});
  const [showManual, setShowManual] = useState(false);

  const hoy = new Date().toISOString().split("T")[0];

  // FILTRO: Camiones que ya arribaron y esperan análisis
  const camionesEsperandoCalidad = operaciones.filter(
    (op) => op.fechacup === hoy && op.estado === "A",
  );

  const seleccionarCamion = (op: Operacion) => {
    setOperacionActiva(op);
    const rubrosDelProd = rxp.filter((r) => r.codigoprod === op.codprod);
    const inicial: { [key: string]: string } = {};
    rubrosDelProd.forEach((r) => (inicial[r.codigorub] = ""));
    setValoresCalidad(inicial);
  };

  const procesarCalidad = () => {
    if (!operacionActiva) return;

    const rubrosDelProd = rxp.filter(
      (r) => r.codigoprod === operacionActiva.codprod,
    );

    // 1. Validar campos vacíos
    const incompleto = rubrosDelProd.some(
      (r) => valoresCalidad[r.codigorub] === "",
    );
    if (incompleto) {
      toast.error("ERROR: DEBE COMPLETAR TODOS LOS VALORES DEL ANÁLISIS");
      return;
    }

    let contRubCorr = 0;
    rubrosDelProd.forEach((r) => {
      const valor = Number(valoresCalidad[r.codigorub]);
      if (valor >= r.valmin && valor <= r.valmax) contRubCorr++;
    });

    // Lógica de aprobación
    const esAceptado =
      contRubCorr === rubrosDelProd.length ||
      (rubrosDelProd.length > 1 && contRubCorr === rubrosDelProd.length - 1);

    const nuevoEstado = esAceptado ? "C" : "R";

    const nuevasOperaciones = operaciones.map((op) =>
      op.patente === operacionActiva.patente && op.fechacup === hoy
        ? { ...op, estado: nuevoEstado as any }
        : op,
    );

    setOperaciones(nuevasOperaciones);

    // 2. Feedback con Toasts
    if (esAceptado) {
      toast.success(`CALIDAD APROBADA: ${operacionActiva.patente}`, {
        description: "Unidad liberada para descarga (Estado: C).",
      });
    } else {
      toast.error(`CALIDAD RECHAZADA: ${operacionActiva.patente}`, {
        description: "Unidad bloqueada por no cumplir estándares (Estado: R).",
      });
    }

    // Limpiar formulario inmediatamente
    setOperacionActiva(null);
    setValoresCalidad({});
  };

  return (
    <div className="relative min-h-screen bg-gray-100 dark:bg-black font-mono transition-colors duration-300">
      {/* CAPA DE FONDO: INTERFAZ DE CALIDAD */}
      <div className="flex items-center justify-center min-h-screen w-full bg-gray-100 dark:bg-black p-4 transition-all duration-300">
        {/* PANEL PRINCIPAL (Fondo #0a0a0a para negro profundo) */}
        <div className="border-2 border-violet-600 dark:border-violet-600 p-8 bg-white dark:bg-[#0a0a0a] shadow-xl dark:shadow-[0_0_20px_rgba(139,92,246,0.2)] w-full max-w-md transition-colors duration-300">
          <h2 className="text-center mb-8 text-xl font-bold tracking-[0.2em] text-violet-600 dark:text-violet-500 border-b-2 border-violet-600 dark:border-violet-900 pb-4 uppercase italic">
            [ Registrar Calidad ]
          </h2>

          {!operacionActiva ? (
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
                      className="flex justify-between items-center p-3 border border-gray-300 dark:border-gray-800 bg-gray-50 dark:bg-black hover:border-violet-500 dark:hover:border-violet-500 transition-all group text-left"
                    >
                      <div className="flex flex-col">
                        <span className="text-gray-900 dark:text-white font-bold">
                          {op.patente}
                        </span>
                        <span className="text-[9px] text-gray-500 uppercase">
                          {op.codprod}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold text-violet-600 dark:text-violet-500 border border-violet-200 dark:border-violet-900 px-2 py-1 uppercase group-hover:bg-violet-500 group-hover:text-white dark:group-hover:bg-violet-900 dark:group-hover:text-black transition-colors">
                        Analizar
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 border border-dashed border-gray-300 dark:border-gray-800 text-gray-500 dark:text-gray-700 text-xs italic">
                    NO HAY CAMIONES ARRIBADOS PENDIENTES
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5 animate-in slide-in-from-bottom duration-300">
              <div className="text-gray-900 dark:text-white text-[10px] border-b border-gray-300 dark:border-gray-800 pb-2 flex justify-between uppercase font-bold">
                <span>UNIDAD: {operacionActiva.patente}</span>
                <span className="text-violet-600 dark:text-violet-500">
                  PROD: {operacionActiva.codprod}
                </span>
              </div>

              <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {rxp
                  .filter((r) => r.codigoprod === operacionActiva.codprod)
                  .map((r, index) => {
                    const infoRubro = rubrosBase.find(
                      (rb) => rb.codigo === r.codigorub,
                    );
                    return (
                      <div key={r.codigorub} className="flex flex-col gap-1">
                        <label className="text-[10px] text-gray-500 uppercase flex justify-between">
                          <span>
                            {infoRubro
                              ? infoRubro.nombre
                              : `RUBRO ${r.codigorub}`}
                          </span>
                          <span className="italic text-violet-600 dark:text-violet-500">
                            RANGO: {r.valmin}-{r.valmax}
                          </span>
                        </label>
                        <input
                          type="number"
                          className="bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 p-2 text-gray-900 dark:text-white focus:border-violet-500 outline-none text-center"
                          value={valoresCalidad[r.codigorub]}
                          autoFocus={index === 0}
                          onChange={(e) =>
                            setValoresCalidad({
                              ...valoresCalidad,
                              [r.codigorub]: e.target.value,
                            })
                          }
                        />
                      </div>
                    );
                  })}
              </div>

              <div className="flex flex-col gap-3 mt-4">
                <button
                  onClick={procesarCalidad}
                  className="bg-transparent border border-violet-600 text-violet-600 dark:text-violet-500 py-3 hover:bg-violet-600 hover:text-white dark:hover:text-black transition-all font-bold uppercase text-sm"
                >
                  [ GUARDAR ANÁLISIS ]
                </button>
                <button
                  onClick={() => setOperacionActiva(null)}
                  className="text-gray-500 text-[10px] hover:text-black dark:hover:text-white uppercase text-center italic"
                >
                  Cancelar Carga
                </button>
              </div>
            </div>
          )}

          {/* MANUAL DE AYUDA CORREGIDO */}
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
