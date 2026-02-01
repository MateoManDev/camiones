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

interface Producto {
  codigo: string;
  nombre: string;
}

export const Recepcion = ({ onVolver }: { onVolver: () => void }) => {
  const [operaciones, setOperaciones] = useLocalStorage<Operacion[]>(
    "operaciones_dat",
    [],
  );
  // Traemos los productos para obtener los nombres
  const [productos] = useLocalStorage<Producto[]>("productos_dat", []);
  const [showManual, setShowManual] = useState(false);

  const hoy = new Date().toISOString().split("T")[0];

  // Filtramos solo los pendientes de hoy
  const cuposPendientesHoy = operaciones.filter(
    (op) => op.fechacup === hoy && op.estado === "P",
  );

  // Función para obtener el nombre del producto según el código
  const obtenerNombreProducto = (codigo: string) => {
    const prod = productos.find((p) => p.codigo === codigo);
    return prod ? prod.nombre : `CÓDIGO: ${codigo}`;
  };

  const registrarArribo = (opSeleccionada: Operacion) => {
    if (
      !window.confirm(
        `¿Confirmar arribo de la patente ${opSeleccionada.patente}?`,
      )
    ) {
      return;
    }

    const nuevasOperaciones = operaciones.map((op) =>
      op.patente === opSeleccionada.patente &&
      op.fechacup === hoy &&
      op.estado === "P"
        ? { ...op, estado: "A" as const }
        : op,
    );

    setOperaciones(nuevasOperaciones);
    alert(`✅ Camión ${opSeleccionada.patente} registrado.`);
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-black p-4 font-mono">
      <div className="border-2 border-yellow-500 p-8 bg-gray-900 shadow-[0_0_20px_rgba(234,179,8,0.2)] w-full max-w-md">
        <h2 className="text-center mb-8 text-xl font-bold tracking-[0.2em] text-yellow-500 border-b-2 border-yellow-900 pb-4 uppercase italic">
          [ Recepción de Unidades ]
        </h2>

        <div className="flex flex-col gap-4">
          <label className="text-[10px] text-yellow-700 uppercase tracking-widest font-bold">
            Seleccione unidad para ingreso:
          </label>

          <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
            {cuposPendientesHoy.length > 0 ? (
              cuposPendientesHoy.map((op, idx) => (
                <button
                  key={`${op.patente}-${idx}`}
                  onClick={() => registrarArribo(op)}
                  className="flex justify-between items-center p-4 border border-gray-800 bg-black hover:border-yellow-500 transition-all group text-left"
                >
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-lg tracking-wider">
                      {op.patente}
                    </span>
                    {/* Ahora muestra el Nombre en lugar del Código */}
                    <span className="text-[9px] text-cyan-600 uppercase font-bold italic">
                      {obtenerNombreProducto(op.codprod)}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-bold text-yellow-600 border border-yellow-900 px-2 py-1 uppercase group-hover:bg-yellow-600 group-hover:text-black transition-colors">
                      INGRESAR
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-12 border border-dashed border-gray-800 text-gray-700 text-xs">
                NO HAY CUPOS PENDIENTES
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onVolver}
          className="w-full text-red-700 text-[10px] font-bold border-t border-gray-800 pt-4 text-center mt-8 uppercase hover:text-red-500"
        >
          &lt;&lt; Volver al Menú Principal
        </button>
      </div>
    </div>
  );
};
