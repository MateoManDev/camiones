import React, { useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";

// IMPORTACIONES PARA EL CALENDARIO
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
  bruto: number;
  tara: number;
}

interface Producto {
  codigo: string;
  nombre: string;
  estado: "A" | "B";
}

// Interfaz para el estado del Modal
interface ModalState {
  isOpen: boolean;
  type: "INFO" | "ERROR" | "CONFIRM";
  message: string;
  onConfirm?: () => void;
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

  // --- ESTADO DEL MODAL ---
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: "INFO",
    message: "",
  });

  const closeModal = () => setModal({ ...modal, isOpen: false });

  const handleEntregaCupo = () => {
    // 1. Validar que la fecha no sea nula y formatearla
    if (!startDate) {
      setModal({
        isOpen: true,
        type: "ERROR",
        message: "❗ Por favor seleccione una fecha",
      });
      return;
    }
    const fechaFormateada = startDate.toISOString().split("T")[0];

    // 2. Validar Patente
    if (patente.length < 6 || patente.length > 7) {
      setModal({
        isOpen: true,
        type: "ERROR",
        message: "❗ Ingrese una patente válida (6-7 caracteres)",
      });
      return;
    }

    // 3. Verificar duplicados
    const existeCupo = operaciones.find(
      (op) =>
        op.patente === patente.toUpperCase() && op.fechacup === fechaFormateada,
    );
    if (existeCupo) {
      setModal({
        isOpen: true,
        type: "ERROR",
        message: "⚠️ Ya existe cupo para esta patente en la fecha",
      });
      return;
    }

    // 4. Validar Producto
    const productoValido = productos.find(
      (p) => p.codigo === codProd && p.estado === "A",
    );
    if (!productoValido) {
      setModal({
        isOpen: true,
        type: "ERROR",
        message: "❗ El producto no existe o no está activo",
      });
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

    // Mensaje de éxito
    setModal({
      isOpen: true,
      type: "INFO",
      message: "✅ Cupo otorgado exitosamente",
    });

    setPatente("");
    setCodProd("");
  };

  return (
    <div className="relative min-h-screen bg-black font-mono">
      {/* CAPA DE FONDO: FORMULARIO */}
      <div
        className={`flex items-center justify-center min-h-screen w-full bg-black p-4 transition-all duration-300 ${modal.isOpen ? "opacity-60 blur-[2px] pointer-events-none scale-[0.99]" : "opacity-100 blur-0 scale-100"}`}
      >
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

            {/* Calendario */}
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
                className="w-full text-red-700 text-[10px] font-bold border-t border-gray-800 pt-4 text-center mt-6 uppercase hover:text-red-500 transition-all"
              >
                &lt;&lt; Volver al Menú Principal
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CAPA DE MODAL (SUPERPUESTO) */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-transparent backdrop-blur-sm pointer-events-auto transition-all duration-300">
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

            <div className="flex gap-2">
              <button
                onClick={closeModal}
                className={`w-full py-3 text-[10px] font-bold uppercase transition-all ${
                  modal.type === "ERROR"
                    ? "bg-red-900/40 border border-red-600 text-red-500"
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
