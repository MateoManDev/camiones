import React, { useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
// FIX: Importación correcta del locale
import { es } from "date-fns/locale";
// 1. IMPORTAR SONNER
import { toast } from "sonner";

registerLocale("es", es);

// --- INTERFACES ---
interface Operacion {
  patente: string;
  codprod: string;
  fechacup: string;
  estado: "P" | "A" | "C" | "B" | "F" | "R";
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

// Interfaz Simplificada para el Modal (Solo Confirmación)
interface ModalState {
  isOpen: boolean;
  message: string;
  onConfirm?: () => void;
}

export const SilosYRechazos = ({ onVolver }: { onVolver: () => void }) => {
  const [operaciones] = useLocalStorage<Operacion[]>("operaciones_dat", []);
  const [silos, setSilos] = useLocalStorage<Silo[]>("silos_dat", []);
  const [productos] = useLocalStorage<Producto[]>("productos_dat", []);

  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [showManual, setShowManual] = useState(false);

  // Estados para manejar la descarga de silos
  const [siloAjuste, setSiloAjuste] = useState<Silo | null>(null);
  const [cantidadSalida, setCantidadSalida] = useState("");

  // --- ESTADO DEL MODAL ---
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    message: "",
  });

  const closeModal = () => setModal({ ...modal, isOpen: false });

  const fechaFiltro = selectedDate
    ? selectedDate.toISOString().split("T")[0]
    : "";

  const obtenerNombreProducto = (codigo: string) => {
    const prod = productos.find((p) => p.codigo === codigo);
    return prod ? prod.nombre : "S/P";
  };

  const camionesRechazados = operaciones.filter(
    (op) =>
      op.estado === "R" && (fechaFiltro ? op.fechacup === fechaFiltro : true),
  );

  // --- LÓGICA DE GESTIÓN DE SILOS ---

  const abrirPanelSalida = (silo: Silo) => {
    setSiloAjuste(silo);
    setCantidadSalida("");
  };

  const confirmarSalida = () => {
    if (!siloAjuste) return;
    const kilos = Number(cantidadSalida);

    // 1. Validaciones con TOAST
    if (!cantidadSalida || kilos <= 0) {
      toast.error("ERROR: INGRESE UNA CANTIDAD MAYOR A 0");
      return;
    }

    if (kilos > siloAjuste.stock) {
      toast.error("STOCK INSUFICIENTE", {
        description: `El silo solo tiene ${siloAjuste.stock} KG disponibles.`,
      });
      return;
    }

    // 2. Pedir confirmación con el Modal (Acción Crítica)
    setModal({
      isOpen: true,
      message: `¿Confirmar salida de ${kilos.toLocaleString()} KG del ${siloAjuste.nombre}?`,
      onConfirm: () => {
        // Ejecutar la resta de stock
        const nuevosSilos = silos.map((s) =>
          s.codsil === siloAjuste.codsil ? { ...s, stock: s.stock - kilos } : s,
        );

        setSilos(nuevosSilos);

        // 3. Notificación de Éxito
        toast.success("SALIDA REGISTRADA CORRECTAMENTE", {
          description: `Nuevo stock en ${siloAjuste.nombre}: ${(siloAjuste.stock - kilos).toLocaleString()} KG`,
        });

        setSiloAjuste(null);
        setCantidadSalida("");
        closeModal();
      },
    });
  };

  return (
    <div className="relative min-h-screen bg-gray-100 dark:bg-black font-mono transition-colors duration-300">
      {/* CAPA DE FONDO: CONTENIDO PRINCIPAL */}
      <div
        className={`flex items-center justify-center min-h-screen w-full bg-gray-100 dark:bg-black p-4 transition-all duration-300 ${modal.isOpen || siloAjuste ? "opacity-60 blur-[2px] pointer-events-none scale-[0.99]" : "opacity-100 blur-0 scale-100"}`}
      >
        <div className="border-2 border-yellow-500 dark:border-yellow-600 p-8 bg-white dark:bg-[#0a0a0a] shadow-xl dark:shadow-[0_0_20px_rgba(234,179,8,0.2)] w-full max-w-2xl transition-colors duration-300">
          <h2 className="text-center mb-8 text-xl font-bold tracking-[0.2em] text-yellow-600 dark:text-yellow-500 border-b-2 border-yellow-600 dark:border-yellow-900 pb-4 uppercase italic">
            [ Gestión y Monitoreo ]
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* COLUMNA IZQUIERDA: SILOS INTERACTIVOS */}
            <div>
              <p className="text-[10px] text-yellow-800 dark:text-yellow-700 uppercase tracking-widest mb-4 font-bold border-b border-yellow-200 dark:border-yellow-900/30 pb-1">
                ➤ Stock en Planta
              </p>
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {silos.length > 0 ? (
                  silos.map((silo) => {
                    const porcentaje =
                      silo.capacidad > 0
                        ? Math.min((silo.stock / silo.capacidad) * 100, 100)
                        : 0;

                    return (
                      <div
                        key={silo.codsil}
                        className="bg-gray-50 dark:bg-black/40 p-3 border border-gray-300 dark:border-gray-800 hover:border-yellow-600 dark:hover:border-yellow-900 transition-all group relative"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex flex-col">
                            <span className="text-gray-900 dark:text-white text-[11px] font-bold uppercase">
                              {silo.nombre}
                            </span>
                            <span className="text-cyan-700 dark:text-cyan-600 text-[8px] font-bold italic uppercase">
                              {obtenerNombreProducto(silo.codprod)}
                            </span>
                          </div>
                          <div className="text-right">
                            <span
                              className={`text-[10px] font-bold ${porcentaje > 90 ? "text-red-600 dark:text-red-500 animate-pulse" : "text-gray-500 dark:text-gray-400"}`}
                            >
                              {porcentaje.toFixed(1)}%
                            </span>
                          </div>
                        </div>

                        {/* Barra de Stock */}
                        <div className="w-full bg-gray-200 dark:bg-gray-950 h-2 rounded-full overflow-hidden border border-gray-300 dark:border-gray-800 mb-2">
                          <div
                            className={`h-full transition-all duration-1000 ${
                              porcentaje > 90
                                ? "bg-red-600 dark:shadow-[0_0_10px_rgba(220,38,38,0.5)]"
                                : "bg-yellow-500 dark:bg-yellow-600"
                            }`}
                            style={{ width: `${porcentaje}%` }}
                          ></div>
                        </div>

                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[8px] text-gray-600 dark:text-gray-600 uppercase font-bold tracking-tighter">
                            Libre:{" "}
                            {(silo.capacidad - silo.stock).toLocaleString()} KG
                          </span>
                          <span className="text-[9px] text-gray-700 dark:text-gray-500 font-bold">
                            {silo.stock.toLocaleString()} /{" "}
                            {silo.capacidad.toLocaleString()}
                          </span>
                        </div>

                        {/* BOTÓN DE ACCIÓN */}
                        <button
                          onClick={() => abrirPanelSalida(silo)}
                          className="w-full text-[9px] border border-yellow-600/50 dark:border-yellow-900/50 text-yellow-800 dark:text-yellow-700 hover:bg-yellow-500 dark:hover:bg-yellow-900 hover:text-white uppercase py-1 transition-colors font-bold pointer-events-auto"
                        >
                          Registrar Salida / Venta
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500 dark:text-gray-700 text-[10px] italic">
                    No hay silos configurados en administración.
                  </p>
                )}
              </div>
            </div>

            {/* COLUMNA DERECHA: RECHAZOS */}
            <div className="flex flex-col">
              <p className="text-[10px] text-red-700 dark:text-red-700 uppercase tracking-widest mb-4 font-bold border-b border-red-200 dark:border-red-900/30 pb-1">
                ➤ Historial de Rechazos
              </p>

              <DatePicker
                selected={selectedDate}
                // FIX: Tipado explícito para que TS no marque error implícito
                onChange={(date: Date | null) => setSelectedDate(date)}
                locale="es"
                dateFormat="dd/MM/yyyy"
                className="w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 p-2 text-gray-900 dark:text-white text-xs mb-4 outline-none focus:border-yellow-500"
              />

              <div className="flex-1 min-h-[150px] max-h-[220px] overflow-y-auto bg-gray-50 dark:bg-black/60 border border-gray-300 dark:border-gray-800 p-3 custom-scrollbar">
                {camionesRechazados.length > 0 ? (
                  camionesRechazados.map((op, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col mb-3 pb-2 border-b border-gray-200 dark:border-gray-900 last:border-0"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-red-600 dark:text-red-500 font-bold text-xs tracking-widest">
                          {op.patente}
                        </span>
                        <span className="text-[9px] text-gray-500 italic">
                          {obtenerNombreProducto(op.codprod)}
                        </span>
                      </div>
                      <span className="text-[8px] text-red-800 dark:text-red-900 uppercase font-bold mt-0.5">
                        Motivo: Fallo en parámetros de calidad
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-30 italic">
                    <p className="text-gray-400 dark:text-gray-500 text-[9px] uppercase">
                      Sin rechazos registrados
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/10 border border-red-200 dark:border-red-900/40 text-center">
                <span className="text-[10px] text-red-700 uppercase font-bold">
                  Total del día:{" "}
                </span>
                <span className="text-gray-900 dark:text-white font-bold ml-2">
                  {camionesRechazados.length} Unidades
                </span>
              </div>
            </div>
          </div>

          {/* MANUAL DESPLEGABLE */}
          <div className="mt-6 border border-gray-300 dark:border-gray-800 rounded-sm overflow-hidden font-mono">
            <button
              onClick={() => setShowManual(!showManual)}
              className="w-full bg-gray-200 dark:bg-gray-800/50 p-2 text-[10px] text-yellow-700 dark:text-yellow-500 flex justify-between items-center hover:bg-gray-300 dark:hover:bg-gray-800 transition-colors uppercase font-bold italic"
            >
              <span>{showManual ? "▼" : "▶"} Manual de Operaciones</span>
            </button>
            {showManual && (
              <div className="p-3 bg-gray-100 dark:bg-black/30 border border-gray-300 dark:border-gray-800 text-[9px] text-gray-600 dark:text-gray-500 space-y-2 italic">
                <p>
                  • Use "REGISTRAR SALIDA" para descontar stock (ventas,
                  traslados).
                </p>
                <p>• Los silos muestran la ocupación en tiempo real.</p>
                <p>• Si supera el 90%, el sistema indicará estado crítico.</p>
              </div>
            )}
          </div>

          <button
            onClick={onVolver}
            className="w-full text-red-700 text-[10px] font-bold border-t border-gray-300 dark:border-gray-800 pt-4 text-center mt-6 uppercase hover:text-red-500 transition-all"
          >
            &lt;&lt; Volver al Menú Principal
          </button>
        </div>
      </div>

      {/* --- PANEL FLOTANTE: REGISTRO DE SALIDA (CAPA INTERMEDIA) --- */}
      {siloAjuste && !modal.isOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-auto">
          <div className="w-full max-w-sm border-2 border-yellow-500 dark:border-yellow-600 bg-white dark:bg-[#0a0a0a] p-6 shadow-2xl animate-in zoom-in duration-200">
            <div className="text-center border-b border-yellow-200 dark:border-yellow-900/50 pb-4 mb-4">
              <h3 className="text-yellow-600 dark:text-yellow-500 font-bold uppercase tracking-widest text-sm">
                Registro de Salida
              </h3>
              <p className="text-gray-900 dark:text-white font-bold text-xs mt-1">
                {siloAjuste.nombre}
              </p>
              <p className="text-[9px] text-gray-500 italic uppercase">
                Prod: {obtenerNombreProducto(siloAjuste.codprod)}
              </p>
            </div>

            <div className="flex flex-col gap-2 mb-6">
              <label className="text-[9px] text-gray-500 dark:text-gray-400 uppercase font-bold">
                Kilos a descontar:
              </label>
              <input
                type="number"
                autoFocus
                className="bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 p-3 text-gray-900 dark:text-white text-center focus:border-yellow-500 outline-none text-lg"
                placeholder="0"
                value={cantidadSalida}
                onChange={(e) => setCantidadSalida(e.target.value)}
              />
              <p className="text-[9px] text-right text-gray-500 dark:text-gray-600">
                Stock actual: {siloAjuste.stock.toLocaleString()} KG
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSiloAjuste(null)}
                className="flex-1 border border-gray-300 dark:border-gray-700 text-gray-500 py-2 text-[10px] uppercase font-bold hover:bg-gray-100 dark:hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarSalida}
                className="flex-1 bg-yellow-500 dark:bg-yellow-600 text-white dark:text-black py-2 text-[10px] uppercase font-bold hover:bg-yellow-600 dark:hover:bg-yellow-500 transition-colors"
              >
                Procesar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DEL SISTEMA (SOLO CONFIRMACIÓN) --- */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-transparent backdrop-blur-sm pointer-events-auto transition-all duration-300">
          <div className="w-full max-w-sm border-2 p-6 bg-white dark:bg-[#0a0a0a] shadow-2xl dark:shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in zoom-in duration-200 border-yellow-500 dark:border-yellow-600 shadow-yellow-500/40 dark:shadow-yellow-900/40">
            <h4 className="text-center font-bold mb-4 tracking-widest uppercase text-[10px] text-yellow-600 dark:text-yellow-500">
              [ ? ] CONFIRMAR
            </h4>

            <p className="text-gray-900 dark:text-white text-center text-[11px] mb-6 font-mono uppercase italic leading-tight">
              {modal.message}
            </p>

            <div className="flex gap-2">
              <button
                onClick={closeModal}
                className="flex-1 border border-gray-300 dark:border-gray-700 text-gray-500 py-3 text-[10px] uppercase font-bold hover:bg-gray-100 dark:hover:text-white transition-colors"
              >
                Cancelar
              </button>

              <button
                onClick={modal.onConfirm}
                className="flex-1 py-3 text-[10px] font-bold uppercase transition-all bg-yellow-500 text-white dark:text-black hover:bg-yellow-600 dark:hover:bg-yellow-500"
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
