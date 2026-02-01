import React, { useState } from "react";
import { AdminMenu } from "./components/Admin";
import { EntregaCupos } from "./components/EntregaCupos";
import { Recepcion } from "./components/Recepcion";
import { RegistrarCalidad } from "./components/RegistrarCalidad";
import { Pesaje } from "./components/Pesaje";
import { Reportes } from "./components/Reportes";
import { SilosYRechazos } from "./components/SilosYRechazos";

type Seccion =
  | "MENU"
  | "ADMIN"
  | "CUPOS"
  | "RECEPCION"
  | "CALIDAD"
  | "PESAJE" // Unificado
  | "REPORTES"
  | "SILOS_RECHAZOS";

const App = () => {
  const [vista, setVista] = useState<Seccion>("MENU");

  const renderContenido = () => {
    switch (vista) {
      case "ADMIN":
        return <AdminMenu onVolver={() => setVista("MENU")} />;
      case "CUPOS":
        return <EntregaCupos onVolver={() => setVista("MENU")} />;
      case "RECEPCION":
        return <Recepcion onVolver={() => setVista("MENU")} />;
      case "CALIDAD":
        return <RegistrarCalidad onVolver={() => setVista("MENU")} />;
      case "PESAJE":
        return <Pesaje onVolver={() => setVista("MENU")} />;
      case "REPORTES":
        return <Reportes onVolver={() => setVista("MENU")} />;
      case "SILOS_RECHAZOS":
        return <SilosYRechazos onVolver={() => setVista("MENU")} />;
      default:
        return <MenuPrincipal alSeleccionar={(s) => setVista(s)} />;
    }
  };

  return <div className="w-full h-screen bg-black">{renderContenido()}</div>;
};

// Componente Interno para el Menú
const MenuPrincipal = ({
  alSeleccionar,
}: {
  alSeleccionar: (s: Seccion) => void;
}) => {
  const opciones = [
    { id: "ADMIN", label: "ADMINISTRACIÓN" },
    { id: "CUPOS", label: "ENTREGA DE CUPOS" },
    { id: "RECEPCION", label: "RECEPCIÓN" },
    { id: "CALIDAD", label: "REGISTRAR CALIDAD" },
    { id: "PESAJE", label: "CONTROL DE BÁSCULA (PESAJE)" },
    { id: "REPORTES", label: "REPORTES" },
    { id: "SILOS_RECHAZOS", label: "SILOS Y RECHAZOS" },
  ];

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-black p-4 font-mono">
      <div className="border-2 border-white p-6 bg-gray-900 shadow-2xl flex flex-col min-h-[85vh] w-[450px]">
        <h2 className="text-center mb-6 text-xl font-bold text-gray-400 tracking-widest border-b border-white pb-4 italic uppercase">
          SISTEMA DE GESTIÓN LOGÍSTICA
        </h2>

        <div className="flex flex-col gap-3 flex-1 justify-center">
          {opciones.map((op) => (
            <button
              key={op.id}
              onClick={() => alSeleccionar(op.id as Seccion)}
              className="w-full text-center px-4 py-3 border border-gray-700 
                     transition-all duration-200 text-gray-400
                     hover:bg-white hover:text-black hover:font-bold
                     active:scale-95 uppercase tracking-widest text-sm"
            >
              {op.label}
            </button>
          ))}

          <button
            onClick={() =>
              window.confirm("¿Desea cerrar la sesión?") && window.close()
            }
            className="w-full text-center px-4 py-3 border border-red-900 
                     text-red-700 mt-4 transition-all duration-200
                     hover:bg-red-700 hover:text-white uppercase tracking-widest text-xs italic"
          >
            SALIR DEL SISTEMA
          </button>
        </div>

        <div className="mt-6 text-[10px] text-gray-600 text-center border-t border-gray-800 pt-4 uppercase">
          Terminal v2.0 - Acceso Autorizado
        </div>
      </div>
    </div>
  );
};

export default App;
