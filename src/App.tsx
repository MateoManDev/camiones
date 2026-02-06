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
import { GestionFlota } from "./components/GestionFlota";
import { LandingPage } from "./components/LandingPage";

type Seccion =
  | "LANDING"
  | "MENU"
  | "ADMIN"
  | "CUPOS"
  | "RECEPCION"
  | "CALIDAD"
  | "PESAJE"
  | "REPORTES"
  | "SILOS_RECHAZOS"
  | "FLOTA";

const App = () => {
  // Inicializamos leyendo el HASH de la URL si existe, sino LANDING
  const [vista, setVista] = useState<Seccion>(() => {
    const hash = window.location.hash.replace("#", "").toUpperCase();
    // Validamos si el hash es una sección válida, sino va a LANDING
    const seccionesValidas = [
      "MENU",
      "ADMIN",
      "CUPOS",
      "RECEPCION",
      "CALIDAD",
      "PESAJE",
      "REPORTES",
      "SILOS_RECHAZOS",
      "FLOTA",
    ];
    return seccionesValidas.includes(hash) ? (hash as Seccion) : "LANDING";
  });

  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "dark";
    }
    return "dark";
  });

  // --- LÓGICA DE NAVEGACIÓN (HISTORIAL DEL NAVEGADOR) ---

  // 1. Cuando cambia la 'vista', actualizamos la URL (pushState)
  useEffect(() => {
    const hashActual = window.location.hash.replace("#", "");
    if (hashActual !== vista) {
      // Guardamos en el historial para que el botón "Atrás" funcione
      window.history.pushState(null, "", `#${vista}`);
    }
  }, [vista]);

  // 2. Escuchar el botón "Atrás" del navegador
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.replace("#", "").toUpperCase();
      // Si el hash está vacío (root), volvemos a LANDING
      if (!hash) {
        setVista("LANDING");
      } else {
        // Si hay hash, navegamos a esa vista
        setVista(hash as Seccion);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // --- FIN LÓGICA DE NAVEGACIÓN ---

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
      case "LANDING":
        return <LandingPage onIngresar={() => setVista("MENU")} />;
      case "MENU":
        return (
          <MenuDashboard
            alSeleccionar={(s) => setVista(s as Seccion)}
            onLogout={() => setVista("LANDING")}
          />
        );
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
      case "FLOTA":
        return <GestionFlota onVolver={() => setVista("MENU")} />;
      default:
        // Fallback por seguridad
        return (
          <MenuDashboard
            alSeleccionar={(s) => setVista(s as Seccion)}
            onLogout={() => setVista("LANDING")}
          />
        );
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
        className="fixed top-4 right-4 z-[2000] px-4 py-2 text-[10px] font-bold border-2 border-gray-400 dark:border-gray-800 bg-white dark:bg-black shadow-lg hover:border-cyan-500 transition-colors uppercase tracking-widest"
      >
        {theme === "dark" ? "[ MODO CLARO ]" : "[ MODO OSCURO ]"}
      </button>

      {renderContenido()}
    </div>
  );
};

export default App;
