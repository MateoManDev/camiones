import React, { useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";

// --- INTERFACES ---
interface Producto {
  codigo: string;
  nombre: string;
  estado: "A" | "B";
}
interface Rubro {
  codigo: string;
  nombre: string;
}
interface Silo {
  codsil: string;
  nombre: string;
  codprod: string;
  stock: number;
  capacidad: number;
}
interface RubroXProducto {
  codigorub: string;
  codigoprod: string;
  valmin: number;
  valmax: number;
}

// Interfaz para controlar el Modal
interface ModalState {
  isOpen: boolean;
  type: "INFO" | "ERROR" | "CONFIRM";
  message: string;
  onConfirm?: () => void;
}

type SubVista = "PRINCIPAL" | "PRODUCTOS" | "RUBROS" | "SILOS" | "RXP";

// --- 1. COMPONENTE DE AYUDA DESPLEGABLE ---
const SeccionAyuda = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-6 border border-gray-800 rounded-sm overflow-hidden font-mono">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-gray-800/50 p-2 text-[10px] text-cyan-500 flex justify-between items-center hover:bg-gray-800 transition-colors uppercase font-bold italic"
      >
        <span>{isOpen ? "▼" : "▶"} Manual de Operaciones</span>
        <span className="text-[8px] opacity-50">
          {isOpen ? "CERRAR" : "ABRIR"}
        </span>
      </button>

      {isOpen && (
        <div className="p-3 bg-black/40 text-[9px] text-gray-400 space-y-4 animate-in fade-in duration-300">
          <div>
            <p className="text-yellow-600 font-bold mb-1 underline">
              ESTADOS DEL CAMIÓN:
            </p>
            <ul className="space-y-1">
              <li>
                <span className="text-white font-bold">A:</span> ACTIVO / EN
                PLAYA - Camión listo para descarga.
              </li>
              <li>
                <span className="text-white font-bold">B:</span> BLOQUEADO /
                RECHAZADO - No cumple estándares.
              </li>
            </ul>
          </div>

          <div>
            <p className="text-yellow-600 font-bold mb-1 underline">
              FLUJO DE TRABAJO (PASOS):
            </p>
            <div className="flex flex-col gap-1">
              <p>
                1. Crear <b className="text-cyan-600">PRODUCTOS</b> primero.
              </p>
              <p>
                2. Definir <b className="text-cyan-600">RUBROS</b> generales.
              </p>
              <p>
                3. Unirlos en <b className="text-cyan-600">RUBROS X PRODUCTO</b>{" "}
                (Límites).
              </p>
              <p>
                4. Asignar <b className="text-cyan-600">SILOS</b> con su
                respectivo producto.
              </p>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-2 italic text-gray-500 text-[8px]">
            * Tip: Usa el icono ✎ en la lista para editar rápidamente registros
            existentes.
          </div>
        </div>
      )}
    </div>
  );
};

// --- 2. COMPONENTE DE PANEL PRINCIPAL ---
const PanelGestion = ({
  titulo,
  isSilo,
  isRxP,
  onConfirmar,
  onEliminar,
  onSeleccionarEdit,
  lista,
  keyNombre,
  keyId,
  editandoId,
  formNombre,
  setFormNombre,
  formCodigo,
  setFormCodigo,
  formAux,
  setFormAux,
  formMin,
  setFormMin,
  formMax,
  setFormMax,
  productosParaSelect,
  rubrosParaSelect,
  setSubVista,
  resetForm,
  onVolver,
}: any) => (
  <div className="flex items-center justify-center min-h-screen w-full bg-black p-4 font-mono">
    <div className="border-2 border-cyan-500 p-8 bg-gray-900 shadow-[0_0_20px_rgba(6,182,212,0.3)] w-full max-w-md">
      <h3 className="text-cyan-400 font-bold mb-6 text-xl tracking-widest text-center border-b border-cyan-900 pb-2 uppercase italic">
        {titulo}{" "}
        {editandoId && (
          <span className="text-yellow-500 text-[10px] animate-pulse">
            {" "}
            (EDITANDO)
          </span>
        )}
      </h3>

      {/* FORMULARIO */}
      <div className="flex flex-col gap-3 mb-8">
        {!isRxP && (
          <>
            <input
              className="bg-black border border-gray-700 p-2 text-cyan-500 outline-none focus:border-cyan-500 uppercase text-xs"
              placeholder="NOMBRE"
              value={formNombre}
              onChange={(e) => setFormNombre(e.target.value.toUpperCase())}
            />
            <input
              className={`bg-black border p-2 outline-none uppercase text-xs ${editandoId ? "border-yellow-900 text-yellow-700" : "border-gray-700 text-cyan-500 focus:border-cyan-500"}`}
              placeholder="CÓDIGO"
              value={formCodigo}
              disabled={!!editandoId}
              onChange={(e) => setFormCodigo(e.target.value.toUpperCase())}
            />
          </>
        )}

        {(isSilo || isRxP) && (
          <select
            className="bg-black border border-gray-700 p-2 text-yellow-500 text-xs outline-none focus:border-cyan-500"
            value={formAux}
            onChange={(e) => setFormAux(e.target.value)}
          >
            <option value="">-- SELECCIONE PRODUCTO --</option>
            {productosParaSelect.map((p: Producto) => (
              <option key={p.codigo} value={p.codigo}>
                {p.nombre}
              </option>
            ))}
          </select>
        )}

        {/* CAMPO DE CAPACIDAD AGREGADO SOLO PARA SILOS */}
        {isSilo && (
          <input
            type="number"
            className="bg-black border border-gray-700 p-2 text-cyan-500 outline-none focus:border-cyan-500 text-xs"
            placeholder="CAPACIDAD MÁXIMA (KG)"
            value={formMin}
            onChange={(e) => setFormMin(e.target.value)}
          />
        )}

        {isRxP && (
          <>
            <select
              className="bg-black border border-gray-700 p-2 text-cyan-500 text-xs outline-none focus:border-cyan-500"
              value={formCodigo}
              onChange={(e) => setFormCodigo(e.target.value)}
            >
              <option value="">-- SELECCIONE RUBRO --</option>
              {rubrosParaSelect.map((r: Rubro) => (
                <option key={r.codigo} value={r.codigo}>
                  {r.nombre}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                className="bg-black border border-gray-700 p-2 text-white text-[10px] outline-none"
                placeholder="MIN"
                value={formMin}
                onChange={(e) => setFormMin(e.target.value)}
              />
              <input
                type="number"
                className="bg-black border border-gray-700 p-2 text-white text-[10px] outline-none"
                placeholder="MAX"
                value={formMax}
                onChange={(e) => setFormMax(e.target.value)}
              />
            </div>
          </>
        )}

        <button
          onClick={onConfirmar}
          className={`mt-2 border py-2 transition-all font-bold uppercase text-xs ${editandoId ? "border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black" : "border-cyan-500 text-cyan-500 hover:bg-cyan-500 hover:text-black"}`}
        >
          {editandoId ? "[ GUARDAR CAMBIOS ]" : "[ + AÑADIR REGISTRO ]"}
        </button>
        {editandoId && (
          <button
            onClick={resetForm}
            className="text-[10px] text-gray-600 hover:text-white uppercase tracking-tighter"
          >
            ✕ CANCELAR EDICIÓN
          </button>
        )}
      </div>

      {/* LISTADO */}
      <div className="space-y-1 max-h-40 overflow-y-auto border-t border-gray-800 pt-4 mb-2">
        {lista.map((item: any, idx: number) => (
          <div
            key={idx}
            className="flex justify-between items-center py-2 border-b border-gray-800 group hover:bg-white/5 px-1"
          >
            <div className="flex flex-col text-[10px]">
              <span className="text-white uppercase">
                {isRxP
                  ? `${item.codigoprod} ➔ ${item.codigorub}`
                  : item[keyNombre]}
              </span>
              <span className="text-cyan-700 font-bold">
                {isRxP
                  ? `MIN: ${item.valmin} | MAX: ${item.valmax}`
                  : isSilo
                    ? `CAP: ${item.capacidad || 0} KG | ID: ${item[keyId]}`
                    : `ID: ${item[keyId]}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSeleccionarEdit(item)}
                className="text-gray-600 hover:text-yellow-500 p-1 text-xs transition-colors"
              >
                ✎
              </button>
              <button
                onClick={() =>
                  onEliminar(
                    isRxP
                      ? `${item.codigoprod}-${item.codigorub}`
                      : item[keyId],
                  )
                }
                className="text-red-900 hover:text-red-500 font-bold p-1 text-xs"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MANUAL DESPLEGABLE */}
      <SeccionAyuda />

      <div className="mt-6 border-t border-gray-800 pt-4">
        <button
          onClick={() => {
            setSubVista("PRINCIPAL");
            resetForm();
          }}
          className="w-full text-cyan-700 text-[10px] uppercase text-center py-1 hover:text-cyan-400"
        >
          ▲ VOLVER A ADMINISTRACIÓN
        </button>
        <button
          onClick={onVolver}
          className="w-full text-red-700 text-[10px] font-bold text-center mt-2 uppercase hover:text-red-500"
        >
          &lt;&lt; Volver al Menú Principal
        </button>
      </div>
    </div>
  </div>
);

// --- 3. COMPONENTE PRINCIPAL (AdminMenu) ---
export const AdminMenu = ({ onVolver }: { onVolver: () => void }) => {
  const [subVista, setSubVista] = useState<SubVista>("PRINCIPAL");
  const [productos, setProductos] = useLocalStorage<Producto[]>(
    "productos_dat",
    [],
  );
  const [rubros, setRubros] = useLocalStorage<Rubro[]>("rubros_dat", []);
  const [silos, setSilos] = useLocalStorage<Silo[]>("silos_dat", []);
  const [rxp, setRxp] = useLocalStorage<RubroXProducto[]>(
    "rubrosXproducto_dat",
    [],
  );

  const [formNombre, setFormNombre] = useState("");
  const [formCodigo, setFormCodigo] = useState("");
  const [formAux, setFormAux] = useState("");
  const [formMin, setFormMin] = useState("");
  const [formMax, setFormMax] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);

  // --- ESTADO DEL MODAL (NUEVO) ---
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: "INFO",
    message: "",
  });

  const closeModal = () => setModal({ ...modal, isOpen: false });

  const resetForm = () => {
    setFormNombre("");
    setFormCodigo("");
    setFormAux("");
    setFormMin("");
    setFormMax("");
    setEditandoId(null);
  };

  const handleConfirmar = (
    tipo: string,
    lista: any[],
    setLista: (l: any[]) => void,
    keyId: string,
    payload: any,
  ) => {
    // REEMPLAZO DE ALERTS NATIVOS POR MODALES
    if (!formNombre && !payload.valmin && tipo !== "Relación")
      return setModal({
        isOpen: true,
        type: "ERROR",
        message: "❗ Nombre requerido.",
      });
    if (!formCodigo && tipo !== "Relación")
      return setModal({
        isOpen: true,
        type: "ERROR",
        message: "❗ Código requerido.",
      });

    if (editandoId) {
      setLista(
        lista.map((item) => {
          const itemId =
            tipo === "Relación"
              ? `${item.codigoprod}-${item.codigorub}`
              : item[keyId];
          return itemId === editandoId ? payload : item;
        }),
      );
      setModal({
        isOpen: true,
        type: "INFO",
        message: `✅ ${tipo} actualizado.`,
      });
    } else {
      const checkId =
        tipo === "Relación"
          ? `${payload.codigoprod}-${payload.codigorub}`
          : formCodigo;
      if (
        lista.find(
          (item) =>
            (tipo === "Relación"
              ? `${item.codigoprod}-${item.codigorub}`
              : item[keyId]) === checkId,
        )
      ) {
        return setModal({
          isOpen: true,
          type: "ERROR",
          message: "❗ El registro ya existe.",
        });
      }
      setLista([...lista, payload]);
      setModal({
        isOpen: true,
        type: "INFO",
        message: `✅ ${tipo} registrado.`,
      });
    }
    resetForm();
  };

  const commonProps = {
    formNombre,
    setFormNombre,
    formCodigo,
    setFormCodigo,
    formAux,
    setFormAux,
    formMin,
    setFormMin,
    formMax,
    setFormMax,
    editandoId,
    setSubVista,
    resetForm,
    onVolver,
  };

  // --- RENDERIZADO DE CONTENIDO (FUNCIÓN INTERNA) ---
  // Usamos esto para que el return sea limpio y permita el overlay
  const renderContent = () => {
    if (subVista === "PRODUCTOS")
      return (
        <PanelGestion
          {...commonProps}
          titulo="Productos"
          lista={productos}
          keyNombre="nombre"
          keyId="codigo"
          onConfirmar={() =>
            handleConfirmar("Producto", productos, setProductos, "codigo", {
              codigo: formCodigo,
              nombre: formNombre,
              estado: "A",
            })
          }
          onEliminar={(id: string) =>
            setModal({
              isOpen: true,
              type: "CONFIRM",
              message: `¿Eliminar Producto ${id}?`,
              onConfirm: () => {
                setProductos(productos.filter((p) => p.codigo !== id));
                closeModal();
              },
            })
          }
          onSeleccionarEdit={(p: Producto) => {
            setEditandoId(p.codigo);
            setFormNombre(p.nombre);
            setFormCodigo(p.codigo);
          }}
        />
      );
    if (subVista === "RUBROS")
      return (
        <PanelGestion
          {...commonProps}
          titulo="Rubros"
          lista={rubros}
          keyNombre="nombre"
          keyId="codigo"
          onConfirmar={() =>
            handleConfirmar("Rubro", rubros, setRubros, "codigo", {
              codigo: formCodigo,
              nombre: formNombre,
            })
          }
          onEliminar={(id: string) =>
            setModal({
              isOpen: true,
              type: "CONFIRM",
              message: `¿Eliminar Rubro ${id}?`,
              onConfirm: () => {
                setRubros(rubros.filter((r) => r.codigo !== id));
                closeModal();
              },
            })
          }
          onSeleccionarEdit={(r: Rubro) => {
            setEditandoId(r.codigo);
            setFormNombre(r.nombre);
            setFormCodigo(r.codigo);
          }}
        />
      );
    if (subVista === "SILOS")
      return (
        <PanelGestion
          {...commonProps}
          titulo="Silos"
          isSilo={true}
          lista={silos}
          productosParaSelect={productos}
          keyNombre="nombre"
          keyId="codsil"
          onConfirmar={() => {
            if (!formAux)
              return setModal({
                isOpen: true,
                type: "ERROR",
                message: "❗ Seleccione producto.",
              });
            if (!formMin)
              return setModal({
                isOpen: true,
                type: "ERROR",
                message: "❗ Capacidad requerida.",
              });
            handleConfirmar("Silo", silos, setSilos, "codsil", {
              codsil: formCodigo,
              nombre: formNombre,
              codprod: formAux,
              stock: editandoId
                ? silos.find((s) => s.codsil === editandoId)?.stock || 0
                : 0,
              capacidad: Number(formMin),
            });
          }}
          onEliminar={(id: string) =>
            setModal({
              isOpen: true,
              type: "CONFIRM",
              message: `¿Eliminar Silo ${id}?`,
              onConfirm: () => {
                setSilos(silos.filter((s) => s.codsil !== id));
                closeModal();
              },
            })
          }
          onSeleccionarEdit={(s: Silo) => {
            setEditandoId(s.codsil);
            setFormNombre(s.nombre);
            setFormCodigo(s.codsil);
            setFormAux(s.codprod);
            setFormMin(String(s.capacidad || ""));
          }}
        />
      );
    if (subVista === "RXP")
      return (
        <PanelGestion
          {...commonProps}
          titulo="Relación RxP"
          isRxP={true}
          lista={rxp}
          productosParaSelect={productos}
          rubrosParaSelect={rubros}
          onConfirmar={() => {
            if (!formAux || !formCodigo || !formMin || !formMax)
              return setModal({
                isOpen: true,
                type: "ERROR",
                message: "❗ Datos incompletos.",
              });
            const payload = {
              codigoprod: formAux,
              codigorub: formCodigo,
              valmin: Number(formMin),
              valmax: Number(formMax),
            };
            handleConfirmar("Relación", rxp, setRxp, "ID_RXP", payload);
          }}
          onEliminar={(comb: string) => {
            const [pId, rId] = comb.split("-");
            setModal({
              isOpen: true,
              type: "CONFIRM",
              message: "Eliminar Relación de Calidad?",
              onConfirm: () => {
                setRxp(
                  rxp.filter(
                    (r) => !(r.codigoprod === pId && r.codigorub === rId),
                  ),
                );
                closeModal();
              },
            });
          }}
          onSeleccionarEdit={(r: RubroXProducto) => {
            setEditandoId(`${r.codigoprod}-${r.codigorub}`);
            setFormAux(r.codigoprod);
            setFormCodigo(r.codigorub);
            setFormMin(String(r.valmin));
            setFormMax(String(r.valmax));
          }}
        />
      );

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black gap-4 font-mono">
        <div className="border-2 border-white p-10 bg-gray-900 flex flex-col gap-3 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
          <h2 className="text-white text-center mb-6 tracking-widest font-bold border-b border-white pb-2 uppercase italic">
            Admin Panel
          </h2>
          {["PRODUCTOS", "RUBROS", "RXP", "SILOS"].map((v) => (
            <button
              key={v}
              onClick={() => setSubVista(v as SubVista)}
              className="border border-cyan-500 p-3 w-64 text-cyan-500 hover:bg-cyan-500 hover:text-black uppercase font-bold text-sm transition-all"
            >
              {v.replace("RXP", "Rubros x Producto")}
            </button>
          ))}
          <button
            onClick={onVolver}
            className="border border-red-500 p-3 w-64 text-red-500 hover:bg-red-500 hover:text-white uppercase font-bold text-sm mt-4 italic transition-all"
          >
            Regresar
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen bg-black font-mono">
      {/* CAPA DE FONDO: MENÚS Y CONTENIDO */}
      {/* Si el modal está abierto, aplicamos desenfoque y desactivamos clics */}
      <div
        className={`transition-all duration-300 ${modal.isOpen ? "opacity-50 blur-sm pointer-events-none" : ""}`}
      >
        {renderContent()}
      </div>

      {/* CAPA SUPERIOR: EL CARTEL (MODAL) */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-sm">
          <div
            className={`w-full max-w-sm border-2 p-6 bg-gray-900 shadow-2xl animate-in zoom-in duration-200 ${
              modal.type === "ERROR"
                ? "border-red-600 shadow-red-900/40"
                : modal.type === "CONFIRM"
                  ? "border-yellow-600 shadow-yellow-900/40"
                  : "border-emerald-600 shadow-emerald-900/40"
            }`}
          >
            <h4
              className={`text-center font-bold mb-4 tracking-widest uppercase text-xs ${
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
              {modal.type === "CONFIRM" && (
                <button
                  onClick={closeModal}
                  className="flex-1 border border-gray-700 text-gray-500 py-3 text-[10px] uppercase font-bold hover:text-white transition-colors"
                >
                  Cancelar
                </button>
              )}

              <button
                onClick={modal.onConfirm || closeModal}
                className={`flex-1 py-3 text-[10px] font-bold uppercase transition-all ${
                  modal.type === "ERROR"
                    ? "bg-red-900/40 border border-red-600 text-red-500"
                    : modal.type === "CONFIRM"
                      ? "bg-yellow-600 text-black hover:bg-yellow-500"
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
