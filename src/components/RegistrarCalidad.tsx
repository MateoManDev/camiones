import React, { useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";

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

// Interfaz para el estado del Modal
interface ModalState {
  isOpen: boolean;
  type: "INFO" | "ERROR" | "CONFIRM";
  message: string;
  onConfirm?: () => void;
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

  // --- ESTADO DEL MODAL ---
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: "INFO",
    message: "",
  });

  const closeModal = () => setModal({ ...modal, isOpen: false });

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

    const incompleto = rubrosDelProd.some(
      (r) => valoresCalidad[r.codigorub] === "",
    );
    if (incompleto) {
      setModal({
        isOpen: true,
        type: "ERROR",
        message: "❗ Error: Debe completar todos los valores.",
      });
      return;
    }

    let contRubCorr = 0;
    rubrosDelProd.forEach((r) => {
      const valor = Number(valoresCalidad[r.codigorub]);
      if (valor >= r.valmin && valor <= r.valmax) contRubCorr++;
    });

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

    // Mostramos el resultado y al confirmar limpiamos el formulario
    setModal({
      isOpen: true,
      type: esAceptado ? "INFO" : "ERROR", // Usamos ERROR visualmente para RECHAZADO
      message: esAceptado
        ? "✅ Calidad aprobada. Estado: C - CALADO."
        : "❌ Calidad insuficiente. Estado: R - RECHAZADO.",
      onConfirm: () => {
        setOperacionActiva(null);
        setValoresCalidad({});
        closeModal();
      },
    });
  };

  return (
    <div className="relative min-h-screen bg-black font-mono">
      {/* CAPA DE FONDO: INTERFAZ DE CALIDAD */}
      <div
        className={`flex items-center justify-center min-h-screen w-full bg-black p-4 transition-all duration-300 ${modal.isOpen ? "opacity-60 blur-[2px] pointer-events-none scale-[0.99]" : "opacity-100 blur-0 scale-100"}`}
      >
        <div className="border-2 border-cyan-500 p-8 bg-gray-900 shadow-[0_0_20px_rgba(6,182,212,0.2)] w-full max-w-md">
          <h2 className="text-center mb-8 text-xl font-bold tracking-[0.2em] text-cyan-400 border-b-2 border-cyan-900 pb-4 uppercase italic">
            [ Registrar Calidad ]
          </h2>

          {!operacionActiva ? (
            <div className="flex flex-col gap-4">
              <label className="text-[10px] text-cyan-700 uppercase tracking-widest font-bold">
                Unidades en Playa esperando Calada:
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {camionesEsperandoCalidad.length > 0 ? (
                  camionesEsperandoCalidad.map((op) => (
                    <button
                      key={op.patente}
                      onClick={() => seleccionarCamion(op)}
                      className="flex justify-between items-center p-3 border border-gray-800 bg-black hover:border-cyan-500 transition-all group text-left"
                    >
                      <div className="flex flex-col">
                        <span className="text-white font-bold">
                          {op.patente}
                        </span>
                        <span className="text-[9px] text-gray-500 uppercase">
                          {op.codprod}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold text-cyan-600 border border-cyan-900 px-2 py-1 uppercase">
                        Analizar
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 border border-dashed border-gray-800 text-gray-700 text-xs italic">
                    NO HAY CAMIONES ARRIBADOS PENDIENTES
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5 animate-in slide-in-from-bottom duration-300">
              <div className="text-white text-[10px] border-b border-gray-800 pb-2 flex justify-between uppercase font-bold">
                <span>UNIDAD: {operacionActiva.patente}</span>
                <span className="text-cyan-600">
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
                          <span className="italic text-cyan-900">
                            RANGO: {r.valmin}-{r.valmax}
                          </span>
                        </label>
                        <input
                          type="number"
                          className="bg-black border border-gray-700 p-2 text-white focus:border-cyan-400 outline-none text-center"
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
                  className="bg-transparent border border-cyan-600 text-cyan-600 py-3 hover:bg-cyan-400 hover:text-black transition-all font-bold uppercase text-sm"
                >
                  [ GUARDAR ANÁLISIS ]
                </button>
                <button
                  onClick={() => setOperacionActiva(null)}
                  className="text-gray-500 text-[10px] hover:text-white uppercase text-center italic"
                >
                  Cancelar Carga
                </button>
              </div>
            </div>
          )}

          {/* MANUAL DE AYUDA */}
          <div className="mt-8 border-t border-gray-800 pt-4">
            <button
              onClick={() => setShowManual(!showManual)}
              className="w-full text-[10px] text-gray-500 hover:text-cyan-400 flex justify-between uppercase font-bold"
            >
              <span>{showManual ? "▼" : "▶"} Ayuda Calidad</span>
            </button>
            {showManual && (
              <div className="mt-3 p-3 bg-black/40 border border-gray-800 text-[9px] text-gray-400 space-y-3">
                <p>
                  • Los camiones aparecen aquí tras marcar el **Arribo** en
                  Recepción.
                </p>
                <p>
                  • Al completar el análisis, el camión pasa a estado{" "}
                  <b className="text-white">C (Calado)</b> o{" "}
                  <b className="text-red-500">R (Rechazado)</b>.
                </p>
              </div>
            )}
          </div>

          <button
            onClick={onVolver}
            className="w-full text-red-700 text-[10px] font-bold border-t border-gray-800 pt-4 text-center mt-6 uppercase hover:text-red-500 transition-all"
          >
            &lt;&lt; Volver al Menú Principal
          </button>
        </div>
      </div>

      {/* CAPA DE MODAL (SUPERPUESTO) */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-auto transition-all duration-300">
          <div
            className={`w-full max-w-sm border-2 p-6 bg-gray-900 shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in zoom-in duration-200 ${
              modal.type === "ERROR"
                ? "border-red-600 shadow-red-900/40"
                : modal.type === "CONFIRM"
                  ? "border-yellow-600 shadow-yellow-900/40"
                  : "border-cyan-600 shadow-cyan-900/40"
            }`}
          >
            <h4
              className={`text-center font-bold mb-4 tracking-widest uppercase text-[10px] ${
                modal.type === "ERROR"
                  ? "text-red-500"
                  : modal.type === "CONFIRM"
                    ? "text-yellow-500"
                    : "text-cyan-500"
              }`}
            >
              {modal.type === "ERROR"
                ? "[ ! ] ALERTA"
                : modal.type === "CONFIRM"
                  ? "[ ? ] CONFIRMAR"
                  : "[ i ] RESULTADO"}
            </h4>

            <p className="text-white text-center text-[11px] mb-6 font-mono uppercase italic leading-tight">
              {modal.message}
            </p>

            <div className="flex gap-2">
              <button
                onClick={modal.onConfirm || closeModal}
                className={`w-full py-3 text-[10px] font-bold uppercase transition-all ${
                  modal.type === "ERROR"
                    ? "bg-red-900/40 border border-red-600 text-red-500"
                    : "bg-cyan-600 text-black hover:bg-cyan-400"
                }`}
              >
                ACEPTAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
