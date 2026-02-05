import React, { useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
// 1. IMPORTAR SONNER
import { toast } from "sonner";

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

// Interfaz simplificada para el Modal (Solo Confirmaciones)
interface ModalState {
  isOpen: boolean;
  message: string;
  onConfirm?: () => void;
}

type SubVista = "PRINCIPAL" | "PRODUCTOS" | "RUBROS" | "SILOS" | "RXP";

// --- 1. COMPONENTE DE AYUDA DESPLEGABLE ---
const SeccionAyuda = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-6 border border-gray-300 dark:border-gray-800 rounded-sm overflow-hidden font-mono">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-gray-200 dark:bg-gray-800/50 p-2 text-[10px] text-cyan-700 dark:text-cyan-500 flex justify-between items-center hover:bg-gray-300 dark:hover:bg-gray-800 transition-colors uppercase font-bold italic"
      >
        <span>{isOpen ? "▼" : "▶"} Manual de Operaciones</span>
        <span className="text-[8px] opacity-50">
          {isOpen ? "CERRAR" : "ABRIR"}
        </span>
      </button>

      {isOpen && (
        <div className="p-3 bg-gray-100 dark:bg-black/40 text-[9px] text-gray-600 dark:text-gray-400 space-y-4 animate-in fade-in duration-300">
          <div>
            <p className="text-yellow-600 font-bold mb-1 underline">
              ESTADOS DEL CAMIÓN:
            </p>
            <ul className="space-y-1">
              <li>
                <span className="text-gray-900 dark:text-white font-bold">
                  A:
                </span>{" "}
                ACTIVO / EN PLAYA - Camión listo para descarga.
              </li>
              <li>
                <span className="text-gray-900 dark:text-white font-bold">
                  B:
                </span>{" "}
                BLOQUEADO / RECHAZADO - No cumple estándares.
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

          <div className="border-t border-gray-300 dark:border-gray-800 pt-2 italic text-gray-500 text-[8px]">
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
  // FONDO PRINCIPAL DINÁMICO
  <div className="flex items-center justify-center min-h-screen w-full bg-gray-100 dark:bg-black p-4 font-mono transition-colors duration-300">
    <div className="border-2 border-cyan-500 p-8 bg-white dark:bg-[#0a0a0a] shadow-xl dark:shadow-[0_0_20px_rgba(6,182,212,0.3)] w-full max-w-md transition-colors duration-300">
      <h3 className="text-cyan-600 dark:text-cyan-400 font-bold mb-6 text-xl tracking-widest text-center border-b border-gray-300 dark:border-cyan-900 pb-2 uppercase italic">
        {titulo}{" "}
        {editandoId && (
          <span className="text-yellow-600 dark:text-yellow-500 text-[10px] animate-pulse">
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
              className="bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 p-2 text-cyan-700 dark:text-cyan-500 outline-none focus:border-cyan-500 uppercase text-xs placeholder-gray-400 dark:placeholder-gray-600"
              placeholder="NOMBRE"
              value={formNombre}
              onChange={(e) => setFormNombre(e.target.value.toUpperCase())}
            />
            <input
              className={`bg-gray-50 dark:bg-black border p-2 outline-none uppercase text-xs placeholder-gray-400 dark:placeholder-gray-600 ${
                editandoId
                  ? "border-yellow-500/50 text-yellow-700 dark:text-yellow-700"
                  : "border-gray-300 dark:border-gray-700 text-cyan-700 dark:text-cyan-500 focus:border-cyan-500"
              }`}
              placeholder="CÓDIGO"
              value={formCodigo}
              disabled={!!editandoId}
              onChange={(e) => setFormCodigo(e.target.value.toUpperCase())}
            />
          </>
        )}

        {(isSilo || isRxP) && (
          <select
            className="bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 p-2 text-yellow-600 dark:text-yellow-500 text-xs outline-none focus:border-cyan-500"
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

        {isSilo && (
          <input
            type="number"
            className="bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 p-2 text-cyan-700 dark:text-cyan-500 outline-none focus:border-cyan-500 text-xs placeholder-gray-400 dark:placeholder-gray-600"
            placeholder="CAPACIDAD MÁXIMA (KG)"
            value={formMin}
            onChange={(e) => setFormMin(e.target.value)}
          />
        )}

        {isRxP && (
          <>
            <select
              className="bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 p-2 text-cyan-700 dark:text-cyan-500 text-xs outline-none focus:border-cyan-500"
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
                className="bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 p-2 text-gray-900 dark:text-white text-[10px] outline-none placeholder-gray-400 dark:placeholder-gray-600"
                placeholder="MIN"
                value={formMin}
                onChange={(e) => setFormMin(e.target.value)}
              />
              <input
                type="number"
                className="bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 p-2 text-gray-900 dark:text-white text-[10px] outline-none placeholder-gray-400 dark:placeholder-gray-600"
                placeholder="MAX"
                value={formMax}
                onChange={(e) => setFormMax(e.target.value)}
              />
            </div>
          </>
        )}

        <button
          onClick={onConfirmar}
          className={`mt-2 border py-2 transition-all font-bold uppercase text-xs ${editandoId ? "border-yellow-500 text-yellow-600 dark:text-yellow-500 hover:bg-yellow-500 hover:text-white dark:hover:text-black" : "border-cyan-500 text-cyan-600 dark:text-cyan-500 hover:bg-cyan-500 hover:text-white dark:hover:text-black"}`}
        >
          {editandoId ? "[ GUARDAR CAMBIOS ]" : "[ + AÑADIR REGISTRO ]"}
        </button>
        {editandoId && (
          <button
            onClick={resetForm}
            className="text-[10px] text-gray-500 dark:text-gray-600 hover:text-red-500 dark:hover:text-white uppercase tracking-tighter"
          >
            ✕ CANCELAR EDICIÓN
          </button>
        )}
      </div>

      {/* LISTADO */}
      <div className="space-y-1 max-h-40 overflow-y-auto border-t border-gray-300 dark:border-gray-800 pt-4 mb-2 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-700">
        {lista.map((item: any, idx: number) => (
          <div
            key={idx}
            className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-800 group hover:bg-gray-100 dark:hover:bg-white/5 px-1"
          >
            <div className="flex flex-col text-[10px]">
              <span className="text-gray-900 dark:text-white uppercase">
                {isRxP
                  ? `${item.codigoprod} ➔ ${item.codigorub}`
                  : item[keyNombre]}
              </span>
              <span className="text-cyan-700 dark:text-cyan-500 font-bold">
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
                className="text-gray-500 dark:text-gray-600 hover:text-yellow-500 p-1 text-xs transition-colors"
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
                className="text-red-700 dark:text-red-900 hover:text-red-500 font-bold p-1 text-xs"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MANUAL DESPLEGABLE */}
      <SeccionAyuda />

      <div className="mt-6 border-t border-gray-300 dark:border-gray-800 pt-4">
        <button
          onClick={() => {
            setSubVista("PRINCIPAL");
            resetForm();
          }}
          className="w-full text-cyan-700 dark:text-cyan-500 text-[10px] uppercase text-center py-1 hover:text-cyan-900 dark:hover:text-cyan-400"
        >
          ▲ VOLVER A ADMINISTRACIÓN
        </button>
        <button
          onClick={onVolver}
          className="w-full text-red-700 dark:text-red-700 text-[10px] font-bold text-center mt-2 uppercase hover:text-red-500"
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

  // --- ESTADO DEL MODAL (SOLO CONFIRMACIÓN) ---
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
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
    // 1. VALIDACIONES CON TOAST
    if (!formNombre && !payload.valmin && tipo !== "Relación") {
      toast.error("ERROR: EL NOMBRE ES OBLIGATORIO");
      return;
    }
    if (!formCodigo && tipo !== "Relación") {
      toast.error("ERROR: EL CÓDIGO ES OBLIGATORIO");
      return;
    }

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
      // 2. ÉXITO EDICIÓN
      toast.success(`${tipo.toUpperCase()} ACTUALIZADO CORRECTAMENTE`);
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
        // 3. ERROR DUPLICADO
        toast.warning(`EL REGISTRO YA EXISTE (${checkId})`);
        return;
      }
      setLista([...lista, payload]);
      // 4. ÉXITO CREACIÓN
      toast.success(`${tipo.toUpperCase()} REGISTRADO CON ÉXITO`);
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
              message: `¿ELIMINAR PRODUCTO ${id}?`,
              onConfirm: () => {
                setProductos(productos.filter((p) => p.codigo !== id));
                toast.success("PRODUCTO ELIMINADO");
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
              message: `¿ELIMINAR RUBRO ${id}?`,
              onConfirm: () => {
                setRubros(rubros.filter((r) => r.codigo !== id));
                toast.success("RUBRO ELIMINADO");
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
            if (!formAux) return toast.error("DEBE SELECCIONAR UN PRODUCTO");
            if (!formMin) return toast.error("CAPACIDAD REQUERIDA");

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
              message: `¿ELIMINAR SILO ${id}?`,
              onConfirm: () => {
                setSilos(silos.filter((s) => s.codsil !== id));
                toast.success("SILO ELIMINADO");
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
              return toast.error("DATOS INCOMPLETOS PARA LA RELACIÓN");

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
              message: "¿ELIMINAR RELACIÓN DE CALIDAD?",
              onConfirm: () => {
                setRxp(
                  rxp.filter(
                    (r) => !(r.codigoprod === pId && r.codigorub === rId),
                  ),
                );
                toast.success("RELACIÓN ELIMINADA");
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-black gap-4 font-mono transition-colors duration-300">
        <div className="border-2 border-gray-300 dark:border-white p-10 bg-white dark:bg-[#0a0a0a] flex flex-col gap-3 shadow-lg dark:shadow-[0_0_15px_rgba(255,255,255,0.1)]">
          <h2 className="text-gray-900 dark:text-white text-center mb-6 tracking-widest font-bold border-b border-gray-300 dark:border-white pb-2 uppercase italic">
            Admin Panel
          </h2>
          {["PRODUCTOS", "RUBROS", "RXP", "SILOS"].map((v) => (
            <button
              key={v}
              onClick={() => setSubVista(v as SubVista)}
              className="border border-cyan-500 p-3 w-64 text-cyan-600 dark:text-cyan-500 hover:bg-cyan-500 hover:text-white dark:hover:text-black uppercase font-bold text-sm transition-all"
            >
              {v.replace("RXP", "Rubros x Producto")}
            </button>
          ))}
          <button
            onClick={onVolver}
            className="border border-red-500 p-3 w-64 text-red-600 dark:text-red-500 hover:bg-red-500 hover:text-white uppercase font-bold text-sm mt-4 italic transition-all"
          >
            Regresar
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen bg-gray-100 dark:bg-black font-mono transition-colors duration-300">
      {/* CAPA DE FONDO: MENÚS Y CONTENIDO */}
      <div
        className={`transition-all duration-300 ${modal.isOpen ? "opacity-50 blur-sm pointer-events-none" : ""}`}
      >
        {renderContent()}
      </div>

      {/* CAPA SUPERIOR: EL MODAL (SOLO CONFIRMACIÓN) */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-sm">
          <div className="w-full max-w-sm border-2 p-6 bg-white dark:bg-[#0a0a0a] shadow-2xl animate-in zoom-in duration-200 border-yellow-500 shadow-yellow-500/40">
            <h4 className="text-center font-bold mb-4 tracking-widest uppercase text-xs text-yellow-600 dark:text-yellow-500">
              [ ? ] CONFIRMAR
            </h4>

            <p className="text-gray-900 dark:text-white text-center text-[11px] mb-6 font-mono uppercase italic leading-tight">
              {modal.message}
            </p>

            <div className="flex gap-2">
              <button
                onClick={closeModal}
                className="flex-1 border border-gray-300 dark:border-gray-700 text-gray-500 py-3 text-[10px] uppercase font-bold hover:bg-gray-100 dark:hover:text-white transition-colors"
              >
                Cancelar
              </button>

              <button
                onClick={modal.onConfirm}
                className="flex-1 py-3 text-[10px] font-bold uppercase transition-all bg-yellow-500 text-white dark:text-black hover:bg-yellow-600 dark:hover:bg-yellow-500"
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
