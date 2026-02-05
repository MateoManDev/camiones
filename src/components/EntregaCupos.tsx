import React, { useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
// 1. IMPORTAR LA FUNCIÓN TOAST DE SONNER
import { toast } from "sonner";

import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { es } from "date-fns/locale/es";

registerLocale("es", es);

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

  const [patente, setPatente] = useState("");
  const [codProd, setCodProd] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(new Date());

  const handleEntregaCupo = () => {
    // 1. Validar fecha
    if (!startDate) {
      toast.error("ERROR: DEBE SELECCIONAR UNA FECHA");
      return;
    }
    const fechaFormateada = startDate.toISOString().split("T")[0];

    // 2. Validar Patente (6 o 7 caracteres)
    if (patente.length < 6 || patente.length > 7) {
      toast.warning("FORMATO INVÁLIDO: PATENTE DEBE TENER 6-7 CARACTERES");
      return;
    }

    // 3. Verificar duplicados (misma patente, misma fecha)
    const existeCupo = operaciones.find(
      (op) =>
        op.patente === patente.toUpperCase() && op.fechacup === fechaFormateada,
    );
    if (existeCupo) {
      toast.error("DUPLICADO: YA EXISTE CUPO PARA ESTA UNIDAD HOY");
      return;
    }

    // 4. Validar Producto
    const productoValido = productos.find(
      (p) => p.codigo === codProd && p.estado === "A",
    );
    if (!productoValido) {
      toast.error("ERROR: PRODUCTO NO VÁLIDO O INACTIVO");
      return;
    }

    // 5. Cargar Operación
    const nuevaOperacion: Operacion = {
      patente: patente.toUpperCase(),
      fechacup: fechaFormateada,
      codprod: codProd,
      estado: "P",
      bruto: 0,
      tara: 0,
    };

    setOperaciones([...operaciones, nuevaOperacion]);

    // --- ÉXITO CON SONNER ---
    toast.success(`CUPO OTORGADO: ${patente.toUpperCase()}`, {
      description: `Producto: ${productoValido.nombre} - Fecha: ${fechaFormateada}`,
    });

    // Limpiar formulario
    setPatente("");
    setCodProd("");
  };

  return (
    <div className="relative min-h-screen bg-gray-100 dark:bg-black font-mono transition-colors duration-300">
      {/* CAPA DE FONDO: FORMULARIO */}
      <div className="flex items-center justify-center min-h-screen w-full bg-gray-100 dark:bg-black p-4 transition-all duration-300">
        {/* PANEL PRINCIPAL (Fondo #0a0a0a para negro profundo) */}
        <div className="border-2 border-gray-300 dark:border-white p-8 bg-white dark:bg-[#0a0a0a] shadow-2xl dark:shadow-[0_0_30px_rgba(255,255,255,0.1)] w-full max-w-md transition-colors duration-300">
          <h2 className="text-center mb-8 text-xl font-bold tracking-[0.2em] text-gray-900 dark:text-white border-b-2 border-gray-300 dark:border-white pb-4 uppercase">
            [ Registro de Cupos ]
          </h2>

          <div className="flex flex-col gap-5">
            {/* Patente */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600 dark:text-gray-500 uppercase tracking-widest">
                Dominio / Patente
              </label>
              <input
                type="text"
                className="bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 p-3 text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all uppercase placeholder:text-gray-400 dark:placeholder:text-gray-800"
                value={patente}
                onChange={(e) => setPatente(e.target.value)}
                placeholder="ABC 123"
              />
            </div>

            {/* Calendario */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600 dark:text-gray-500 uppercase tracking-widest">
                Fecha de Operación
              </label>
              <DatePicker
                selected={startDate}
                onChange={(date: Date | null) => setStartDate(date)}
                locale="es"
                dateFormat="dd/MM/yyyy"
                className="w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 p-3 text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all cursor-pointer"
                placeholderText="Seleccione fecha"
              />
            </div>

            {/* Selección de Producto */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600 dark:text-gray-500 uppercase tracking-widest">
                Insumo / Producto
              </label>
              <select
                className="bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 p-3 text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                value={codProd}
                onChange={(e) => setCodProd(e.target.value)}
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

            {/* Botones de Acción */}
            <div className="flex flex-col gap-3 mt-4">
              <button
                onClick={handleEntregaCupo}
                className="mt-2 bg-transparent border border-gray-900 dark:border-white text-gray-900 dark:text-white py-2 hover:bg-gray-900 dark:hover:bg-white hover:text-white dark:hover:text-black transition-all font-bold uppercase"
              >
                [ Otorgar Cupo ]
              </button>

              <button
                onClick={onVolver}
                className="w-full text-red-600 dark:text-red-700 text-[10px] font-bold border-t border-gray-300 dark:border-gray-800 pt-4 text-center mt-6 uppercase hover:text-red-500 transition-all"
              >
                &lt;&lt; Volver al Menú Principal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
