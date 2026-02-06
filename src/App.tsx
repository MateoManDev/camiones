import React, { useState, useEffect } from "react";
// 1. IMPORTAR SONNER
import { Toaster } from "sonner";

import { AdminMenu } from "./components/Admin";
import { EntregaCupos } from "./components/EntregaCupos";
import { Recepcion } from "./components/Recepcion";
import { RegistrarCalidad } from "./components/RegistrarCalidad";
import { Pesaje } from "./components/Pesaje";
import { Reportes } from "./components/Reportes";
import { SilosYRechazos } from "./components/SilosYRechazos";
import { MenuDashboard } from "./components/MenuDashboard";
// 2. IMPORTAR LA NUEVA PANTALLA
import { GestionFlota } from "./components/GestionFlota";

type Seccion =
  | "MENU"
  | "ADMIN"
  | "CUPOS"
  | "RECEPCION"
  | "CALIDAD"
  | "PESAJE"
  | "REPORTES"
  | "SILOS_RECHAZOS"
  | "FLOTA"; // <--- 3. AGREGAR TIPO

const App = () => {
  const [vista, setVista] = useState<Seccion>("MENU");

  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "dark";
    }
    return "dark";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

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
      case "FLOTA": // <--- 4. AGREGAR CASO
        return <GestionFlota onVolver={() => setVista("MENU")} />;
      default:
        return <MenuDashboard alSeleccionar={(s) => setVista(s as Seccion)} />;
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-100 dark:bg-black text-gray-900 dark:text-white transition-colors duration-300 font-mono">
      <Toaster
        position="top-center"
        richColors
        theme={theme === "dark" ? "dark" : "light"}
        toastOptions={{
          className:
            "font-mono uppercase text-xs md:text-sm font-bold tracking-wide",
        }}
      />

      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-2000 px-4 py-2 text-[10px] font-bold border-2 border-gray-400 dark:border-gray-800 bg-white dark:bg-black shadow-lg hover:border-cyan-500 transition-colors uppercase tracking-widest"
      >
        {theme === "dark" ? "[ MODO CLARO ]" : "[ MODO OSCURO ]"}
      </button>

      {renderContenido()}
    </div>
  );
};

export default App;
