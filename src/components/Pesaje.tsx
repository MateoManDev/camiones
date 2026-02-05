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

// Interfaz Mejorada para el Modal
interface ModalState {
  isOpen: boolean;
  type: "CONFIRM" | "WARNING"; // Para cambiar el color (Amarillo/Rojo)
  title: string; // Título personalizado
  message: string;
  detalles?: string[];
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
  const [editandoBruto, setEditandoBruto] = useState(false);

  // --- ESTADO DEL MODAL ---
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: "CONFIRM",
    title: "",
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

  // --- LÓGICAS INTERNAS DE GUARDADO (Para llamarlas desde el Modal) ---

  const aplicarGuardadoFinal = (
    nuevasOps: Operacion[],
    nuevosSilos: Silo[],
    neto: number,
  ) => {
    setOperaciones(nuevasOps);
    setSilos(nuevosSilos);

    toast.success("PESAJE FINALIZADO CORRECTAMENTE", {
      description: `Se registraron ${neto} KG netos en el stock.`,
    });

    setOpActiva(null);
    setPesoInput("");
  };

  const aplicarGuardadoBruto = (peso: number) => {
    if (!opActiva) return;
    const nuevasOperaciones = operaciones.map((op) =>
      op.patente === opActiva.patente &&
      op.fechacup === hoy &&
      op.estado === "C"
        ? { ...op, bruto: peso, estado: "B" as const }
        : op,
    );
    setOperaciones(nuevasOperaciones);

    toast.success(`PESO BRUTO REGISTRADO: ${opActiva.patente}`);
    setOpActiva(null);
    setPesoInput("");
    closeModal(); // Cierra el modal si estaba abierto
  };

  const aplicarCorreccionBruto = (peso: number) => {
    if (!opActiva) return;
    const nuevasOperaciones = operaciones.map((op) =>
      op.patente === opActiva.patente && op.fechacup === hoy
        ? { ...op, bruto: peso }
        : op,
    );

    setOperaciones(nuevasOperaciones);
    setOpActiva({ ...opActiva, bruto: peso });
    setEditandoBruto(false);
    setPesoInput("");

    toast.success("PESO BRUTO CORREGIDO CORRECTAMENTE");
    closeModal(); // Cierra el modal si estaba abierto
  };

  // --- MANEJADORES DE BOTONES ---

  const guardarCorreccionBruto = () => {
    if (!opActiva || pesoInput === "" || Number(pesoInput) <= 0) {
      toast.error("ERROR: INGRESE UN PESO VÁLIDO");
      return;
    }
    const nuevoBruto = Number(pesoInput);

    // Validación de peso desorbitado con MODAL
    if (nuevoBruto > 60000) {
      setModal({
        isOpen: true,
        type: "WARNING",
        title: "⚠️ ADVERTENCIA DE SEGURIDAD",
        message: `El peso ingresado (${nuevoBruto.toLocaleString()} KG) excede las 60 Toneladas.\n\n¿Confirma que este valor es correcto?`,
        onConfirm: () => aplicarCorreccionBruto(nuevoBruto),
      });
      return;
    }

    aplicarCorreccionBruto(nuevoBruto);
  };

  const guardarMovimiento = () => {
    if (!opActiva || pesoInput === "" || Number(pesoInput) <= 0) {
      toast.error("ERROR: INGRESE UN PESO VÁLIDO");
      return;
    }

    const valorPeso = Number(pesoInput);

    // CASO 1: REGISTRO DE BRUTO (Entrada)
    if (opActiva.estado === "C") {
      // Validación de peso desorbitado con MODAL
      if (valorPeso > 60000) {
        setModal({
          isOpen: true,
          type: "WARNING",
          title: "⚠️ ALERTA DE PESO EXCESIVO",
          message: `Está registrando ${valorPeso.toLocaleString()} KG.\nEste valor es inusual para un camión.\n\n¿Desea continuar?`,
          onConfirm: () => aplicarGuardadoBruto(valorPeso),
        });
        return;
      }
      aplicarGuardadoBruto(valorPeso);
    }

    // CASO 2: REGISTRO DE TARA (Salida)
    else if (opActiva.estado === "B") {
      if (valorPeso >= opActiva.bruto) {
        toast.error("ERROR CRÍTICO: TARA MAYOR AL BRUTO", {
          description:
            "Revise los valores. Si el Bruto está mal, use el botón 'Editar'.",
        });
        return;
      }

      const netoTotal = opActiva.bruto - valorPeso;

      // 1. Identificar silos
      const silosDelProducto = silos.filter(
        (s) => s.codprod === opActiva.codprod,
      );

      // 2. Calcular capacidad
      const capacidadTotalDisponible = silosDelProducto.reduce(
        (acc, s) => acc + (s.capacidad - s.stock),
        0,
      );

      // 3. Bloqueo si supera capacidad
      if (netoTotal > capacidadTotalDisponible) {
        toast.error("🚫 ALERTA: EXCESO DE CAPACIDAD", {
          description: `Intenta descargar ${netoTotal} KG pero solo hay espacio para ${capacidadTotalDisponible} KG.`,
          duration: 8000,
        });
        return;
      }

      // 4. Distribución
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

      // 5. Confirmación con MODAL (Distribución)
      if (silosAfectados.length > 1) {
        setModal({
          isOpen: true,
          type: "CONFIRM",
          title: "⚖️ DISTRIBUCIÓN AUTOMÁTICA",
          message:
            "La carga se dividirá entre varios silos por falta de espacio individual:",
          detalles: silosAfectados,
          onConfirm: () => {
            aplicarGuardadoFinal(nuevasOps, nuevosSilos, netoTotal);
            closeModal();
          },
        });
      } else {
        aplicarGuardadoFinal(nuevasOps, nuevosSilos, netoTotal);
      }
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-100 dark:bg-black font-mono transition-colors duration-300">
      <div
        className={`flex items-center justify-center min-h-screen w-full bg-gray-100 dark:bg-black p-4 transition-all duration-300 ${modal.isOpen ? "opacity-60 blur-[2px] pointer-events-none scale-[0.99]" : "opacity-100 blur-0 scale-100"}`}
      >
        <div className="border-2 border-emerald-500 dark:border-emerald-500 p-8 bg-white dark:bg-[#0a0a0a] shadow-xl dark:shadow-[0_0_20px_rgba(16,185,129,0.2)] w-full max-w-md transition-colors duration-300">
          <h2 className="text-center mb-8 text-xl font-bold tracking-[0.2em] text-emerald-600 dark:text-emerald-500 border-b-2 border-emerald-600 dark:border-emerald-900 pb-4 uppercase italic">
            [ Balanza de Planta ]
          </h2>

          {!opActiva ? (
            <div className="flex flex-col gap-4">
              <label className="text-[10px] text-emerald-700 dark:text-emerald-700 uppercase font-bold tracking-widest text-center">
                Seleccione unidad para pesar:
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {camionesEnEspera.map((op, idx) => (
                  <button
                    key={`${op.patente}-${idx}`}
                    onClick={() => {
                      setOpActiva(op);
                      setEditandoBruto(false);
                      setPesoInput("");
                    }}
                    className="flex justify-between items-center p-4 border border-gray-300 dark:border-gray-800 bg-gray-50 dark:bg-black hover:border-emerald-500 dark:hover:border-emerald-500 transition-all text-left group"
                  >
                    <div className="flex flex-col">
                      <span className="text-gray-900 dark:text-white font-bold text-lg">
                        {op.patente}
                      </span>
                      <span className="text-[9px] text-cyan-600 dark:text-cyan-600 uppercase font-bold italic">
                        {obtenerNombreProducto(op.codprod)}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] font-bold border-2 px-3 py-1 rounded-sm transition-colors ${
                        op.estado === "C"
                          ? "text-orange-600 dark:text-orange-500 border-orange-200 dark:border-orange-900 group-hover:bg-orange-500 group-hover:text-white dark:group-hover:bg-orange-900"
                          : "text-blue-600 dark:text-blue-500 border-blue-200 dark:border-blue-900 group-hover:bg-blue-500 group-hover:text-white dark:group-hover:bg-blue-900"
                      }`}
                    >
                      {op.estado === "C" ? "PESAR BRUTO" : "PESAR TARA"}
                    </span>
                  </button>
                ))}
                {camionesEnEspera.length === 0 && (
                  <div className="text-center py-12 border border-dashed border-gray-300 dark:border-gray-800 text-gray-500 dark:text-gray-700 text-xs italic">
                    NO HAY MOVIMIENTOS PENDIENTES
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6 animate-in slide-in-from-right duration-200">
              <div className="bg-gray-100 dark:bg-black p-4 border border-emerald-200 dark:border-emerald-900">
                <div className="flex justify-between items-center border-b border-emerald-200 dark:border-emerald-900 pb-2">
                  <span className="text-gray-900 dark:text-white font-bold text-xl">
                    {opActiva.patente}
                  </span>
                  <span className="text-cyan-600 dark:text-cyan-600 text-[10px] font-bold uppercase italic">
                    {obtenerNombreProducto(opActiva.codprod)}
                  </span>
                </div>

                {/* --- SECCIÓN DE BRUTO CON EDICIÓN --- */}
                {opActiva.estado === "B" && !editandoBruto && (
                  <div className="mt-2 flex justify-between items-center bg-gray-200 dark:bg-gray-900 p-2 rounded">
                    <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400">
                      BRUTO: {opActiva.bruto} KG
                    </span>
                    <button
                      onClick={() => {
                        setEditandoBruto(true);
                        setPesoInput(opActiva.bruto);
                      }}
                      className="text-[9px] text-blue-600 dark:text-blue-400 underline font-bold hover:text-blue-800"
                    >
                      ✏️ CORREGIR
                    </button>
                  </div>
                )}

                <p className="text-[10px] text-emerald-700 dark:text-emerald-700 font-bold uppercase mt-2 italic tracking-tighter">
                  Acción:{" "}
                  {editandoBruto
                    ? "CORRIGIENDO PESO BRUTO"
                    : opActiva.estado === "C"
                      ? "Registrando Peso de Entrada"
                      : "Registrando Peso de Salida (Tara)"}
                </p>
              </div>

              <div className="flex flex-col gap-2 text-center">
                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                  {editandoBruto
                    ? "NUEVO BRUTO (KG):"
                    : "PESO EN PANTALLA (KG):"}
                </label>
                <input
                  type="number"
                  className={`bg-white dark:bg-black border-2 p-4 text-4xl text-center outline-none ${editandoBruto ? "border-blue-500 text-blue-600 dark:text-blue-500" : "border-gray-300 dark:border-gray-700 text-emerald-600 dark:text-emerald-400 focus:border-emerald-500"}`}
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
                {editandoBruto ? (
                  <>
                    <button
                      onClick={guardarCorreccionBruto}
                      className="bg-blue-600 text-white dark:text-black py-4 font-bold uppercase hover:bg-blue-500 transition-all shadow-md"
                    >
                      [ GUARDAR CORRECCIÓN ]
                    </button>
                    <button
                      onClick={() => {
                        setEditandoBruto(false);
                        setPesoInput("");
                      }}
                      className="text-gray-500 text-[10px] uppercase hover:text-black dark:hover:text-white"
                    >
                      CANCELAR EDICIÓN
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={guardarMovimiento}
                      className="bg-emerald-600 text-white dark:text-black py-4 font-bold uppercase hover:bg-emerald-500 dark:hover:bg-emerald-400 transition-all shadow-md dark:shadow-[0_0_10px_rgba(16,185,129,0.3)]"
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
                      className="text-gray-500 dark:text-gray-600 text-[10px] uppercase hover:text-black dark:hover:text-white text-center italic"
                    >
                      &lt; Volver a la lista sin guardar
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          <button
            onClick={onVolver}
            className="w-full text-red-600 dark:text-red-700 text-[10px] font-bold border-t border-gray-300 dark:border-gray-800 pt-4 text-center mt-6 uppercase hover:text-red-500 transition-all"
          >
            &lt;&lt; Volver al Menú Principal
          </button>
        </div>
      </div>

      {/* --- MODAL MEJORADO (SOPORTA WARNINGS Y CONFIRMACIONES) --- */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-transparent backdrop-blur-sm pointer-events-auto transition-all duration-300">
          <div
            className={`w-full max-w-sm border-2 p-6 bg-white dark:bg-[#0a0a0a] shadow-2xl dark:shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in zoom-in duration-200 ${
              modal.type === "WARNING"
                ? "border-red-600 shadow-red-500/40 dark:shadow-red-900/40"
                : "border-yellow-500 dark:border-yellow-600 shadow-yellow-500/40 dark:shadow-yellow-900/40"
            }`}
          >
            <h4
              className={`text-center font-bold mb-4 tracking-widest uppercase text-[10px] ${
                modal.type === "WARNING"
                  ? "text-red-600 dark:text-red-500"
                  : "text-yellow-600 dark:text-yellow-500"
              }`}
            >
              {modal.title || "[ ? ] CONFIRMACIÓN"}
            </h4>

            <p className="text-gray-900 dark:text-white text-center text-[11px] mb-6 font-mono uppercase italic leading-tight whitespace-pre-line">
              {modal.message}
            </p>

            {modal.detalles && (
              <div className="mb-6 bg-gray-100 dark:bg-black/50 border border-gray-300 dark:border-gray-800 p-2">
                {modal.detalles.map((d, i) => (
                  <p
                    key={i}
                    className="text-gray-600 dark:text-gray-400 text-[10px] font-mono border-b border-gray-300 dark:border-gray-800 last:border-0 pb-1 mb-1 last:mb-0"
                  >
                    • {d}
                  </p>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={closeModal}
                className="flex-1 border border-gray-300 dark:border-gray-700 text-gray-500 py-3 text-[10px] uppercase font-bold hover:text-black dark:hover:text-white transition-colors"
              >
                Cancelar
              </button>

              <button
                onClick={modal.onConfirm}
                className={`flex-1 py-3 text-[10px] font-bold uppercase transition-all ${
                  modal.type === "WARNING"
                    ? "bg-red-600 text-white dark:text-black hover:bg-red-700 dark:hover:bg-red-500"
                    : "bg-yellow-500 text-white dark:text-black hover:bg-yellow-600 dark:hover:bg-yellow-500"
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
