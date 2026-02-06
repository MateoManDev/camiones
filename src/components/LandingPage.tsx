import React, { useState } from "react";

export const LandingPage = ({ onIngresar }: { onIngresar: () => void }) => {
  const [showDocs, setShowDocs] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-mono flex flex-col relative overflow-hidden selection:bg-cyan-500 selection:text-black">
      {/* FONDO ANIMADO (Efecto Grid) */}
      <div
        className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      ></div>

      {/* --- HERO SECTION (Principal) --- */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-8 animate-in slide-in-from-top duration-700">
          <span className="bg-cyan-900/30 text-cyan-400 border border-cyan-800 px-3 py-1 text-[10px] uppercase tracking-[0.3em] rounded-full">
            Sistema de Gestión Logística v1.0
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tighter bg-gradient-to-r from-white via-gray-400 to-gray-600 bg-clip-text text-transparent">
          LOGÍSTICA <br /> CENTZ
        </h1>

        <p className="max-w-xl text-gray-400 text-sm md:text-base mb-10 leading-relaxed">
          Plataforma integral para el control de flujo de camiones, calidad de
          granos, pesaje y gestión de stock en tiempo real.
        </p>

        <div className="flex flex-col md:flex-row gap-4 w-full max-w-md">
          <button
            onClick={onIngresar}
            className="flex-1 bg-white text-black py-4 font-bold uppercase tracking-widest hover:bg-cyan-400 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          >
            Ingresar al Sistema
          </button>

          <button
            onClick={() => setShowDocs(!showDocs)}
            className="flex-1 border border-gray-700 text-gray-400 py-4 font-bold uppercase tracking-widest hover:border-white hover:text-white transition-all"
          >
            {showDocs ? "Ocultar Ayuda" : "Ver Documentación"}
          </button>
        </div>
      </main>

      {/* --- SECCIÓN DE DOCUMENTACIÓN (Desplegable) --- */}
      {showDocs && (
        <section className="relative z-10 bg-[#111] border-t border-gray-800 animate-in slide-in-from-bottom duration-500">
          <div className="max-w-5xl mx-auto p-8 md:p-12">
            <h3 className="text-2xl font-bold text-cyan-500 mb-8 border-b border-gray-800 pb-4 uppercase tracking-widest">
              [ Ciclo de Vida del Camión ]
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* ESTADO 1 */}
              <div className="p-4 border border-gray-800 hover:border-gray-600 transition-colors group">
                <div className="text-4xl mb-2 opacity-30 group-hover:opacity-100 transition-opacity">
                  01
                </div>
                <h4 className="text-yellow-500 font-bold mb-2">
                  P - PENDIENTE
                </h4>
                <p className="text-xs text-gray-500 leading-5">
                  El camión tiene un <b>Cupo Otorgado</b> pero aún no ha llegado
                  a la planta. Se registra en "Entrega de Cupos".
                </p>
              </div>

              {/* ESTADO 2 */}
              <div className="p-4 border border-gray-800 hover:border-gray-600 transition-colors group">
                <div className="text-4xl mb-2 opacity-30 group-hover:opacity-100 transition-opacity">
                  02
                </div>
                <h4 className="text-blue-500 font-bold mb-2">A - ARRIBADO</h4>
                <p className="text-xs text-gray-500 leading-5">
                  El camión está físicamente en playa. Se marca su llegada en el
                  módulo de <b>Recepción</b>.
                </p>
              </div>

              {/* ESTADO 3 */}
              <div className="p-4 border border-gray-800 hover:border-gray-600 transition-colors group">
                <div className="text-4xl mb-2 opacity-30 group-hover:opacity-100 transition-opacity">
                  03
                </div>
                <h4 className="text-purple-500 font-bold mb-2">
                  C - CALIDAD OK
                </h4>
                <p className="text-xs text-gray-500 leading-5">
                  Se analizó la mercadería y fue <b>Aprobada</b>. Si falla, pasa
                  a estado <span className="text-red-500">R (Rechazado)</span>.
                </p>
              </div>

              {/* ESTADO 4 */}
              <div className="p-4 border border-gray-800 hover:border-gray-600 transition-colors group">
                <div className="text-4xl mb-2 opacity-30 group-hover:opacity-100 transition-opacity">
                  04
                </div>
                <h4 className="text-orange-500 font-bold mb-2">B - BRUTO</h4>
                <p className="text-xs text-gray-500 leading-5">
                  Ya se pesó el camión lleno (Entrada). Ahora está descargando
                  en el silo asignado.
                </p>
              </div>

              {/* ESTADO 5 */}
              <div className="p-4 border border-gray-800 hover:border-gray-600 transition-colors group">
                <div className="text-4xl mb-2 opacity-30 group-hover:opacity-100 transition-opacity">
                  05
                </div>
                <h4 className="text-emerald-500 font-bold mb-2">
                  F - FINALIZADO
                </h4>
                <p className="text-xs text-gray-500 leading-5">
                  Se pesó la Tara (Salida). El sistema descontó stock y cerró la
                  operación.
                </p>
              </div>

              {/* GESTIÓN */}
              <div className="p-4 border border-gray-800 hover:border-gray-600 transition-colors bg-gray-900/50">
                <h4 className="text-white font-bold mb-2">GESTIÓN</h4>
                <ul className="text-xs text-gray-500 space-y-2">
                  <li>
                    • <b>Admin:</b> Configure productos y silos.
                  </li>
                  <li>
                    • <b>Reportes:</b> Vea estadísticas.
                  </li>
                  <li>
                    • <b>Flota:</b> Gestione choferes.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="relative z-10 p-6 text-center text-[10px] text-gray-600 border-t border-gray-900">
        <p>© 2026 LOGÍSTICA CENTZ. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};
