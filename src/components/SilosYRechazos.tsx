import React, { useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { es } from "date-fns/locale/es";

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
  capacidad: number; // Campo integrado desde Admin
}

interface Producto {
  codigo: string;
  nombre: string;
}

export const SilosYRechazos = ({ onVolver }: { onVolver: () => void }) => {
  const [operaciones] = useLocalStorage<Operacion[]>("operaciones_dat", []);
  const [silos] = useLocalStorage<Silo[]>("silos_dat", []);
  const [productos] = useLocalStorage<Producto[]>("productos_dat", []);

  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [showManual, setShowManual] = useState(false);

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

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-black p-4 font-mono">
      <div className="border-2 border-yellow-600 p-8 bg-gray-900 shadow-[0_0_20px_rgba(234,179,8,0.2)] w-full max-w-2xl">
        <h2 className="text-center mb-8 text-xl font-bold tracking-[0.2em] text-yellow-500 border-b-2 border-yellow-900 pb-4 uppercase italic">
          [ Monitoreo de Almacenamiento ]
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* COLUMNA IZQUIERDA: ESTADO DE SILOS CON CAPACIDAD REAL */}
          <div>
            <p className="text-[10px] text-yellow-700 uppercase tracking-widest mb-4 font-bold border-b border-yellow-900/30 pb-1">
              ➤ Ocupación en Silos
            </p>
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {silos.length > 0 ? (
                silos.map((silo) => {
                  // Cálculo de porcentaje basado en capacidad real
                  const porcentaje =
                    silo.capacidad > 0
                      ? Math.min((silo.stock / silo.capacidad) * 100, 100)
                      : 0;

                  return (
                    <div
                      key={silo.codsil}
                      className="bg-black/40 p-3 border border-gray-800 hover:border-yellow-900 transition-all group"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex flex-col">
                          <span className="text-white text-[11px] font-bold uppercase">
                            {silo.nombre}
                          </span>
                          <span className="text-cyan-600 text-[8px] font-bold italic uppercase">
                            {obtenerNombreProducto(silo.codprod)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-[10px] font-bold ${porcentaje > 90 ? "text-red-500 animate-pulse" : "text-gray-400"}`}
                          >
                            {porcentaje.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Barra de Stock Dinámica */}
                      <div className="w-full bg-gray-950 h-2 rounded-full overflow-hidden border border-gray-800">
                        <div
                          className={`h-full transition-all duration-1000 ${
                            porcentaje > 90
                              ? "bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]"
                              : "bg-yellow-600"
                          }`}
                          style={{ width: `${porcentaje}%` }}
                        ></div>
                      </div>

                      <div className="flex justify-between mt-1 items-center">
                        <span className="text-[8px] text-gray-600 uppercase font-bold tracking-tighter">
                          Disp: {(silo.capacidad - silo.stock).toLocaleString()}{" "}
                          KG
                        </span>
                        <span className="text-[9px] text-gray-500 font-bold">
                          {silo.stock.toLocaleString()} /{" "}
                          {silo.capacidad.toLocaleString()} KG
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-700 text-[10px] italic">
                  No hay silos configurados en administración.
                </p>
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA: RECHAZOS */}
          <div className="flex flex-col">
            <p className="text-[10px] text-red-700 uppercase tracking-widest mb-4 font-bold border-b border-red-900/30 pb-1">
              ➤ Historial de Rechazos
            </p>

            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              locale="es"
              dateFormat="dd/MM/yyyy"
              className="w-full bg-black border border-gray-700 p-2 text-white text-xs mb-4 outline-none focus:border-yellow-500"
            />

            <div className="flex-1 min-h-[150px] max-h-[220px] overflow-y-auto bg-black/60 border border-gray-800 p-3 custom-scrollbar">
              {camionesRechazados.length > 0 ? (
                camionesRechazados.map((op, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col mb-3 pb-2 border-b border-gray-900 last:border-0"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-red-500 font-bold text-xs tracking-widest">
                        {op.patente}
                      </span>
                      <span className="text-[9px] text-gray-500 italic">
                        {obtenerNombreProducto(op.codprod)}
                      </span>
                    </div>
                    <span className="text-[8px] text-red-900 uppercase font-bold mt-0.5">
                      Motivo: Fallo en parámetros de calidad
                    </span>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-30 italic">
                  <p className="text-gray-500 text-[9px] uppercase">
                    Sin rechazos registrados para esta fecha
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 p-3 bg-red-900/10 border border-red-900/40 text-center">
              <span className="text-[10px] text-red-700 uppercase font-bold">
                Total del día:{" "}
              </span>
              <span className="text-white font-bold ml-2">
                {camionesRechazados.length} Unidades
              </span>
            </div>
          </div>
        </div>

        {/* MANUAL DESPLEGABLE */}
        <div className="mt-8 border-t border-gray-800 pt-4">
          <button
            onClick={() => setShowManual(!showManual)}
            className="w-full text-[10px] text-gray-600 hover:text-yellow-500 flex justify-between uppercase"
          >
            <span>{showManual ? "▼" : "▶"} Guía de Control</span>
            <span className="text-[8px]">MONITOR V2.0</span>
          </button>
          {showManual && (
            <div className="mt-3 p-3 bg-black/30 border border-gray-800 text-[9px] text-gray-500 space-y-2 italic">
              <p>
                • Los silos muestran el porcentaje de ocupación basado en la
                **Capacidad Máxima** definida en Admin.
              </p>
              <p>
                • Si un silo supera el **90%**, la barra se tornará roja
                indicando estado crítico.
              </p>
              <p>
                • El **espacio disponible** se calcula restando el stock actual
                del límite configurado.
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
  );
};
