import React, { useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";

// IMPORTACIONES PARA EL CALENDARIO
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { es } from "date-fns/locale/es"; // Cambiado aquí

registerLocale("es", es);
// Definimos la estructura de la Operación (tu clase reg_operaciones)
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
  // Estado de fecha como objeto Date para el DatePicker
  const [startDate, setStartDate] = useState<Date | null>(new Date());

  const handleEntregaCupo = () => {
    // 1. Validar que la fecha no sea nula y formatearla
    if (!startDate) {
      alert("❗ Por favor seleccione una fecha");
      return;
    }
    const fechaFormateada = startDate.toISOString().split("T")[0];

    // 2. Validar Patente
    if (patente.length < 6 || patente.length > 7) {
      alert("❗ Ingrese una patente de entre 6 y 7 caracteres");
      return;
    }

    // 3. Verificar duplicados (verifDate)
    const existeCupo = operaciones.find(
      (op) => op.patente === patente && op.fechacup === fechaFormateada,
    );
    if (existeCupo) {
      alert("⚠️ Ya existe una patente con cupo en el día de la fecha");
      return;
    }

    // 4. Validar Producto (buscarCod)
    const productoValido = productos.find(
      (p) => p.codigo === codProd && p.estado === "A",
    );
    if (!productoValido) {
      alert("❗ El producto no existe o no está dado de alta");
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
    alert("✅ Patente con cupo otorgado");
    setPatente("");
    setCodProd("");
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-black p-4 font-mono">
      <div className="border-2 border-white p-8 bg-gray-900 shadow-2xl w-full max-w-md">
        <h2 className="text-center mb-8 text-xl font-bold tracking-[0.2em] text-white border-b-2 border-white pb-4 uppercase">
          [ Registro de Cupos ]
        </h2>

        <div className="flex flex-col gap-5">
          {/* Patente */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 uppercase tracking-widest">
              Dominio / Patente
            </label>
            <input
              type="text"
              className="bg-black border border-gray-700 p-3 text-white focus:border-blue-500 outline-none transition-all uppercase placeholder:text-gray-800"
              value={patente}
              onChange={(e) => setPatente(e.target.value)}
              placeholder="ABC 123"
            />
          </div>

          {/* Calendario con DatePicker (Solución al error de 'any') */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 uppercase tracking-widest">
              Fecha de Operación
            </label>
            <DatePicker
              selected={startDate}
              onChange={(date: Date | null) => setStartDate(date)}
              locale="es"
              dateFormat="dd/MM/yyyy"
              className="w-full bg-black border border-gray-700 p-3 text-white focus:border-blue-500 outline-none transition-all cursor-pointer"
              placeholderText="Seleccione fecha"
            />
          </div>

          {/* Selección de Producto */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 uppercase tracking-widest">
              Insumo / Producto
            </label>
            <select
              className="bg-black border border-gray-700 p-3 text-white focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
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
              className="mt-2 bg-transparent border border-white text-white py-2 hover:bg-white hover:text-black transition-all font-bold uppercase"
            >
              [ Otorgar Cupo ]
            </button>

            <button
              onClick={onVolver}
              className="w-full text-red-500 text-xs hover:underline uppercase tracking-tighter font-bold border-t border-gray-800 pt-3 text-center"
            >
              &lt;&lt; Volver al Menú Principal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
