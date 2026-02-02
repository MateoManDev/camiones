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

interface Silo {
  codsil: string;
  nombre: string;
  codprod: string;
  stock: number;
  capacidad: number;
}

interface Producto {
  codigo: string;
  nombre: string;
}

// Interfaz para el estado del Modal
interface ModalState {
  isOpen: boolean;
  type: "INFO" | "ERROR" | "CONFIRM";
  message: string;
  detalles?: string[]; // Agregado para mostrar la lista de distribución
  onConfirm?: () => void;
}

export const Pesaje = ({ onVolver }: { onVolver: () => void }) => {
  const [operaciones, setOperaciones] = useLocalStorage<Operacion[]>(
    "operaciones_dat",
    [],
  );
  const [silos, setSilos] = useLocalStorage<Silo[]>("silos_dat", []);
  const [productos] = useLocalStorage<Producto[]>("productos_dat", []);

  const [opActiva, setOpActiva] = useState<Operacion | null>(null);
  const [pesoInput, setPesoInput] = useState<number | "">("");

  // --- ESTADO DEL MODAL ---
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: "INFO",
    message: "",
  });

  const closeModal = () => setModal({ ...modal, isOpen: false });

  const hoy = new Date().toISOString().split("T")[0];

  const obtenerNombreProducto = (codigo: string) => {
    const prod = productos.find((p) => p.codigo === codigo);
    return prod ? prod.nombre : `CÓD: ${codigo}`;
  };

  const camionesEnEspera = operaciones.filter(
    (op) => op.fechacup === hoy && (op.estado === "C" || op.estado === "B"),
  );

  // Función auxiliar para finalizar el guardado (necesaria para el callback del modal)
  const ejecutarGuardado = (
    nuevasOps: Operacion[],
    nuevosSilos: Silo[],
    neto: number,
  ) => {
    setOperaciones(nuevasOps);
    setSilos(nuevosSilos);

    // Mensaje de éxito final
    setModal({
      isOpen: true,
      type: "INFO",
      message: `✅ Operación finalizada.\nSe registraron ${neto}kg en el stock general.`,
    });

    setOpActiva(null);
    setPesoInput("");
  };

  const guardarMovimiento = () => {
    if (!opActiva || pesoInput === "" || Number(pesoInput) <= 0) {
      setModal({
        isOpen: true,
        type: "ERROR",
        message: "❗ Ingrese un peso válido.",
      });
      return;
    }

    const valorPeso = Number(pesoInput);
    let nuevasOperaciones = [...operaciones];

    // PASO 1: REGISTRO DE BRUTO
    if (opActiva.estado === "C") {
      nuevasOperaciones = operaciones.map((op) =>
        op.patente === opActiva.patente &&
        op.fechacup === hoy &&
        op.estado === "C"
          ? { ...op, bruto: valorPeso, estado: "B" as const }
          : op,
      );
      setOperaciones(nuevasOperaciones);

      setModal({
        isOpen: true,
        type: "INFO",
        message: `✅ BRUTO de ${opActiva.patente} guardado.`,
      });

      setOpActiva(null); // Opcional: Si quieres que salga de la pantalla tras pesar bruto
      setPesoInput("");
    }

    // PASO 2: REGISTRO DE TARA Y DISTRIBUCIÓN INTELIGENTE
    else if (opActiva.estado === "B") {
      if (valorPeso >= opActiva.bruto) {
        setModal({
          isOpen: true,
          type: "ERROR",
          message: "❗ La Tara no puede ser mayor o igual al Bruto.",
        });
        return;
      }

      const netoTotal = opActiva.bruto - valorPeso;

      // 1. Identificar todos los silos que aceptan este producto
      const silosDelProducto = silos.filter(
        (s) => s.codprod === opActiva.codprod,
      );

      // 2. Calcular la capacidad total disponible en la planta para este producto
      const capacidadTotalDisponible = silosDelProducto.reduce(
        (acc, s) => acc + (s.capacidad - s.stock),
        0,
      );

      // 3. Bloqueo si el camión supera el total de la planta
      if (netoTotal > capacidadTotalDisponible) {
        setModal({
          isOpen: true,
          type: "ERROR",
          message: "🚫 BLOQUEO DE CAPACIDAD TOTAL",
          detalles: [
            `Neto: ${netoTotal} kg`,
            `Disponible en planta: ${capacidadTotalDisponible} kg`,
            `No es posible descargar la unidad.`,
          ],
        });
        return;
      }

      // 4. Lógica de Distribución en Cascada
      let restoPorCargar = netoTotal;
      let silosAfectados: string[] = [];

      const nuevosSilos = silos.map((silo) => {
        if (silo.codprod === opActiva.codprod && restoPorCargar > 0) {
          const espacioLibre = silo.capacidad - silo.stock;

          if (espacioLibre > 0) {
            const cargaEnEsteSilo = Math.min(espacioLibre, restoPorCargar);
            restoPorCargar -= cargaEnEsteSilo;
            silosAfectados.push(`${silo.nombre}: +${cargaEnEsteSilo}kg`);
            return { ...silo, stock: silo.stock + cargaEnEsteSilo };
          }
        }
        return silo;
      });

      const nuevasOps = operaciones.map((op) =>
        op.patente === opActiva.patente &&
        op.fechacup === hoy &&
        op.estado === "B"
          ? { ...op, tara: valorPeso, estado: "F" as const }
          : op,
      );

      // 5. Informar al operario si hubo división de carga
      if (silosAfectados.length > 1) {
        setModal({
          isOpen: true,
          type: "CONFIRM",
          message: "⚖️ DISTRIBUCIÓN AUTOMÁTICA REQUERIDA",
          detalles: silosAfectados,
          onConfirm: () => {
            ejecutarGuardado(nuevasOps, nuevosSilos, netoTotal);
            closeModal();
          },
        });
      } else {
        // Guardado directo si entró todo en un solo silo
        ejecutarGuardado(nuevasOps, nuevosSilos, netoTotal);
      }
    }
  };

  return (
    <div className="relative min-h-screen bg-black font-mono">
      {/* CAPA DE FONDO: BALANZA */}
      <div
        className={`flex items-center justify-center min-h-screen w-full bg-black p-4 transition-all duration-300 ${modal.isOpen ? "opacity-60 blur-[2px] pointer-events-none scale-[0.99]" : "opacity-100 blur-0 scale-100"}`}
      >
        <div className="border-2 border-emerald-500 p-8 bg-gray-900 shadow-[0_0_20px_rgba(16,185,129,0.2)] w-full max-w-md">
          <h2 className="text-center mb-8 text-xl font-bold tracking-[0.2em] text-emerald-500 border-b-2 border-emerald-900 pb-4 uppercase italic">
            [ Balanza de Planta ]
          </h2>

          {!opActiva ? (
            <div className="flex flex-col gap-4">
              <label className="text-[10px] text-emerald-700 uppercase font-bold tracking-widest text-center">
                Seleccione unidad para pesar:
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {camionesEnEspera.map((op, idx) => (
                  <button
                    key={`${op.patente}-${idx}`}
                    onClick={() => setOpActiva(op)}
                    className="flex justify-between items-center p-4 border border-gray-800 bg-black hover:border-emerald-500 transition-all text-left group"
                  >
                    <div className="flex flex-col">
                      <span className="text-white font-bold text-lg">
                        {op.patente}
                      </span>
                      <span className="text-[9px] text-cyan-600 uppercase font-bold italic">
                        {obtenerNombreProducto(op.codprod)}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] font-bold border-2 px-3 py-1 rounded-sm transition-colors ${
                        op.estado === "C"
                          ? "text-orange-500 border-orange-900 group-hover:bg-orange-900 group-hover:text-white"
                          : "text-blue-500 border-blue-900 group-hover:bg-blue-900 group-hover:text-white"
                      }`}
                    >
                      {op.estado === "C" ? "PESAR BRUTO" : "PESAR TARA"}
                    </span>
                  </button>
                ))}
                {camionesEnEspera.length === 0 && (
                  <div className="text-center py-12 border border-dashed border-gray-800 text-gray-700 text-xs italic">
                    NO HAY MOVIMIENTOS PENDIENTES
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6 animate-in slide-in-from-right duration-200">
              <div className="bg-black p-4 border border-emerald-900">
                <div className="flex justify-between items-center border-b border-emerald-900 pb-2">
                  <span className="text-white font-bold text-xl">
                    {opActiva.patente}
                  </span>
                  <span className="text-cyan-600 text-[10px] font-bold uppercase italic">
                    {obtenerNombreProducto(opActiva.codprod)}
                  </span>
                </div>
                <p className="text-[10px] text-emerald-700 font-bold uppercase mt-2 italic tracking-tighter">
                  Acción:{" "}
                  {opActiva.estado === "C"
                    ? "Registrando Peso de Entrada"
                    : "Registrando Peso de Salida"}
                </p>
              </div>

              <div className="flex flex-col gap-2 text-center">
                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                  Peso en Pantalla (KG):
                </label>
                <input
                  type="number"
                  className="bg-black border-2 border-gray-700 p-4 text-4xl text-center text-emerald-400 focus:border-emerald-500 outline-none"
                  value={pesoInput}
                  onChange={(e) =>
                    setPesoInput(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={guardarMovimiento}
                  className="bg-emerald-600 text-black py-4 font-bold uppercase hover:bg-emerald-400 transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                >
                  {opActiva.estado === "C"
                    ? "[ CONFIRMAR BRUTO ]"
                    : "[ CONFIRMAR TARA ]"}
                </button>
                <button
                  onClick={() => {
                    setOpActiva(null);
                    setPesoInput("");
                  }}
                  className="text-gray-600 text-[10px] uppercase hover:text-white text-center italic"
                >
                  &lt; Volver a la lista sin guardar
                </button>
              </div>
            </div>
          )}

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
                  : "border-emerald-600 shadow-emerald-900/40"
            }`}
          >
            <h4
              className={`text-center font-bold mb-4 tracking-widest uppercase text-[10px] ${
                modal.type === "ERROR"
                  ? "text-red-500"
                  : modal.type === "CONFIRM"
                    ? "text-yellow-500"
                    : "text-emerald-500"
              }`}
            >
              {modal.type === "ERROR"
                ? "[ ! ] ALERTA"
                : modal.type === "CONFIRM"
                  ? "[ ? ] CONFIRMAR"
                  : "[ i ] SISTEMA"}
            </h4>

            <p className="text-white text-center text-[11px] mb-6 font-mono uppercase italic leading-tight">
              {modal.message}
            </p>

            {/* LISTA DE DETALLES (EJ: DISTRIBUCIÓN DE CARGA) */}
            {modal.detalles && (
              <div className="mb-6 bg-black/50 border border-gray-800 p-2">
                {modal.detalles.map((d, i) => (
                  <p
                    key={i}
                    className="text-gray-400 text-[10px] font-mono border-b border-gray-800 last:border-0 pb-1 mb-1 last:mb-0"
                  >
                    • {d}
                  </p>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              {modal.type === "CONFIRM" && (
                <button
                  onClick={closeModal}
                  className="flex-1 border border-gray-700 text-gray-500 py-3 text-[10px] uppercase font-bold hover:text-white transition-colors"
                >
                  Cancelar
                </button>
              )}

              <button
                onClick={modal.onConfirm || closeModal}
                className={`flex-1 py-3 text-[10px] font-bold uppercase transition-all ${
                  modal.type === "ERROR"
                    ? "bg-red-900/40 border border-red-600 text-red-500"
                    : modal.type === "CONFIRM"
                      ? "bg-yellow-600 text-black hover:bg-yellow-500"
                      : "bg-emerald-600 text-black hover:bg-emerald-400"
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
