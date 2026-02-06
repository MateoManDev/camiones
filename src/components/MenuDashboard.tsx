import React from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";

// --- INTERFACES ---
interface Operacion {
  estado: "P" | "A" | "C" | "B" | "F" | "R";
  fechacup: string;
}
interface Silo {
  nombre: string;
  stock: number;
  capacidad: number;
}

interface DashboardProps {
  alSeleccionar: (vista: string) => void;
  onLogout: () => void;
}

export const MenuDashboard = ({ alSeleccionar, onLogout }: DashboardProps) => {
  const [operaciones] = useLocalStorage<Operacion[]>("operaciones_dat", []);
  const [silos] = useLocalStorage<Silo[]>("silos_dat", []);

  const hoy = new Date().toISOString().split("T")[0];

  // --- MÉTRICAS ---
  const cuposHoy = operaciones.filter((op) => op.fechacup === hoy).length;
  const enPuerta = operaciones.filter(
    (op) => op.fechacup === hoy && op.estado === "P",
  ).length;
  const paraCalidad = operaciones.filter(
    (op) => op.fechacup === hoy && op.estado === "A",
  ).length;
  const paraBalanza = operaciones.filter(
    (op) => op.fechacup === hoy && (op.estado === "C" || op.estado === "B"),
  ).length;

  const silosCriticos = silos.filter(
    (s) => s.capacidad > 0 && s.stock / s.capacidad > 0.9,
  ).length;

  // Clase base común para las tarjetas
  const cardBaseClass =
    "group relative p-6 border bg-white dark:bg-[#0a0a0a] border-gray-300 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#111] transition-all duration-300 text-left shadow-sm dark:shadow-lg flex flex-col justify-center h-32";

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black p-8 font-mono flex flex-col items-center justify-center transition-colors duration-300">
      {/* HEADER */}
      <div className="w-full max-w-6xl mb-6 border-b-2 border-gray-300 dark:border-white/20 pb-4 flex justify-between items-end animate-in slide-in-from-top-4 duration-700">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-[0.2em] uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-500 dark:from-white dark:to-gray-500">
            Sistema Logístico
          </h1>
          <p className="text-cyan-600 dark:text-cyan-500 text-xs md:text-sm mt-1 tracking-widest font-bold">
            CENTRO DE COMANDO V3.0
          </p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-gray-500 text-[10px] uppercase font-bold">
            Fecha Operativa
          </p>
          <p className="text-gray-900 dark:text-white font-bold text-lg">
            {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* GRID DE BOTONES - AHORA 4 COLUMNAS PARA QUE ENTREN LOS 8 MÓDULOS EN 2 FILAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-6xl">
        {/* 1. ADMINISTRACIÓN */}
        <button
          onClick={() => alSeleccionar("ADMIN")}
          className={`${cardBaseClass} hover:border-cyan-600 dark:hover:border-cyan-500 hover:shadow-cyan-500/20`}
        >
          <h3 className="text-cyan-600 dark:text-cyan-500 font-bold text-lg mb-1 group-hover:translate-x-1 transition-transform tracking-wider">
            ADMINISTRACIÓN
          </h3>
          <p className="text-gray-500 text-[10px] uppercase">
            Configuración General
          </p>
        </button>

        {/* 2. CUPOS */}
        <button
          onClick={() => alSeleccionar("CUPOS")}
          className={`${cardBaseClass} hover:border-gray-900 dark:hover:border-white`}
        >
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-gray-900 dark:text-white font-bold text-lg group-hover:translate-x-1 transition-transform tracking-wider">
              CUPOS
            </h3>
            <span className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-sm">
              HOY: {cuposHoy}
            </span>
          </div>
          <p className="text-gray-500 text-[10px] uppercase">
            Asignación de turnos
          </p>
        </button>

        {/* 3. RECEPCIÓN */}
        <button
          onClick={() => alSeleccionar("RECEPCION")}
          className={`${cardBaseClass} hover:border-yellow-600 dark:hover:border-yellow-500 hover:shadow-yellow-500/20`}
        >
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-yellow-600 dark:text-yellow-500 font-bold text-lg group-hover:translate-x-1 transition-transform tracking-wider">
              RECEPCIÓN
            </h3>
            {enPuerta > 0 ? (
              <span className="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-500 border border-yellow-500 text-[10px] font-bold px-2 py-0.5 rounded-sm animate-pulse">
                PUERTA: {enPuerta}
              </span>
            ) : null}
          </div>
          <p className="text-gray-500 text-[10px] uppercase">
            Ingreso de Unidades
          </p>
        </button>

        {/* 4. CALIDAD */}
        <button
          onClick={() => alSeleccionar("CALIDAD")}
          className={`${cardBaseClass} hover:border-violet-600 dark:hover:border-violet-500 hover:shadow-violet-500/20`}
        >
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-violet-600 dark:text-violet-500 font-bold text-lg group-hover:translate-x-1 transition-transform tracking-wider">
              CALIDAD
            </h3>
            {paraCalidad > 0 && (
              <span className="bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400 border border-violet-500 text-[10px] font-bold px-2 py-0.5 rounded-sm animate-pulse">
                PEND: {paraCalidad}
              </span>
            )}
          </div>
          <p className="text-gray-500 text-[10px] uppercase">
            Laboratorio y Análisis
          </p>
        </button>

        {/* 5. BALANZA */}
        <button
          onClick={() => alSeleccionar("PESAJE")}
          className={`${cardBaseClass} hover:border-emerald-600 dark:hover:border-emerald-500 hover:shadow-emerald-500/20`}
        >
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-emerald-600 dark:text-emerald-500 font-bold text-lg group-hover:translate-x-1 transition-transform tracking-wider">
              BALANZA
            </h3>
            {paraBalanza > 0 && (
              <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-500 border border-emerald-500 text-[10px] font-bold px-2 py-0.5 rounded-sm animate-pulse">
                COLA: {paraBalanza}
              </span>
            )}
          </div>
          <p className="text-gray-500 text-[10px] uppercase">Control de Peso</p>
        </button>

        {/* 6. GESTIÓN FLOTA */}
        <button
          onClick={() => alSeleccionar("FLOTA")}
          className={`${cardBaseClass} hover:border-blue-600 dark:hover:border-blue-500 hover:shadow-blue-500/20`}
        >
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-blue-600 dark:text-blue-500 font-bold text-lg group-hover:translate-x-1 transition-transform tracking-wider">
              FLOTA & GPS
            </h3>
            <span className="text-[9px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded border border-blue-200 dark:border-blue-900">
              MANTENIMIENTO
            </span>
          </div>
          <p className="text-gray-500 text-[10px] uppercase">
            Control de Unidades
          </p>
        </button>

        {/* 7. MONITOR SILOS (AHORA INDEPENDIENTE) */}
        <button
          onClick={() => alSeleccionar("SILOS_RECHAZOS")}
          className={`${cardBaseClass} ${
            silosCriticos > 0
              ? "border-red-600 animate-pulse bg-red-50 dark:bg-red-900/10"
              : "hover:border-orange-600 dark:hover:border-orange-500 hover:shadow-orange-500/20"
          }`}
        >
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-orange-600 dark:text-orange-500 font-bold text-lg group-hover:translate-x-1 transition-transform tracking-wider">
              MONITOR SILOS
            </h3>
            {silosCriticos > 0 && (
              <span className="text-[9px] text-red-600 dark:text-red-500 font-bold uppercase border border-red-500 px-1 rounded">
                ⚠ ALERTA
              </span>
            )}
          </div>
          <p className="text-gray-500 text-[10px] uppercase">
            Gestión de Stock
          </p>
        </button>

        {/* 8. REPORTES (AHORA INDEPENDIENTE) */}
        <button
          onClick={() => alSeleccionar("REPORTES")}
          className={`${cardBaseClass} hover:border-red-600 dark:hover:border-red-500 hover:shadow-red-500/20`}
        >
          <h3 className="text-red-600 dark:text-red-500 font-bold text-lg mb-1 group-hover:translate-x-1 transition-transform tracking-wider">
            REPORTES
          </h3>
          <p className="text-gray-500 text-[10px] uppercase">
            Estadísticas y KPI
          </p>
        </button>
      </div>

      {/* FOOTER CON BOTÓN DE SALIDA */}
      <div className="mt-8 w-full max-w-6xl flex justify-between items-center border-t border-gray-300 dark:border-gray-800 pt-6">
        <div className="text-[10px] text-gray-600">
          SISTEMA OPERATIVO V3.0 •{" "}
          <span className="text-emerald-600 dark:text-emerald-500 font-bold">
            ONLINE
          </span>
        </div>
        <button
          onClick={onLogout}
          className="text-[10px] font-bold text-red-700 dark:text-red-500 hover:text-white hover:bg-red-600 border border-transparent hover:border-red-600 px-4 py-2 transition-all uppercase tracking-widest rounded-sm"
        >
          [ SALIR AL INICIO ]
        </button>
      </div>
    </div>
  );
};
