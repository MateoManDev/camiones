import React, { useState, useEffect } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { toast } from "sonner";

// --- LIBRERÍAS DE VALIDACIÓN ---
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// --- INTERFACES DE DATOS ---
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

// --- REGLAS DE VALIDACIÓN ---

// 1. Regla para CÓDIGOS (IDs): Solo letras y números, sin espacios.
const codigoRule = z
  .string()
  .min(2, "Mínimo 2 caracteres")
  .max(10, "Máximo 10 caracteres")
  .regex(/^[A-Z0-9]+$/, "SOLO LETRAS Y NÚMEROS (SIN ESPACIOS)");

// 2. Regla para NOMBRES (Productos/Rubros): NO pueden ser solo números.
const nombreTextoRule = z
  .string()
  .min(3, "Mínimo 3 letras")
  .regex(/^(?!\d+$).+$/, "El nombre no puede ser solo números");

// --- ESQUEMAS ZOD ---

// 1. Esquema Básico
const baseSchema = z.object({
  codigo: codigoRule,
  nombre: nombreTextoRule,
  extra: z.string().optional(),
  min: z.coerce.number().optional(),
  max: z.coerce.number().optional(),
});

// 2. Esquema Silos
const siloSchema = z.object({
  codigo: codigoRule,
  nombre: z.string().min(1, "Nombre obligatorio"),
  extra: z.string().min(1, "Debe elegir producto"),
  min: z.coerce.number().min(1, "Capacidad requerida"),
  max: z.coerce.number().optional(),
});

// 3. Esquema RxP
const rxpSchema = z.object({
  extra: z.string().min(1, "Producto requerido"),
  codigo: z.string().min(1, "Rubro requerido"),
  min: z.coerce.number(),
  max: z.coerce.number(),
  nombre: z.string().optional(),
});

// Tipo unificado para el formulario
type AdminFormValues = {
  codigo: string;
  nombre?: string;
  extra?: string;
  min?: number;
  max?: number;
};

// Interfaz Modal
interface ModalState {
  isOpen: boolean;
  message: string;
  onConfirm?: () => void;
}

type SubVista = "PRINCIPAL" | "PRODUCTOS" | "RUBROS" | "SILOS" | "RXP";

// --- 1. COMPONENTE DE AYUDA ---
const SeccionAyuda = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="mt-6 border border-gray-300 dark:border-gray-800 rounded-sm overflow-hidden font-mono">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-gray-200 dark:bg-gray-800/50 p-3 text-[10px] text-cyan-700 dark:text-cyan-500 flex justify-between items-center hover:bg-gray-300 dark:hover:bg-gray-800 transition-colors uppercase font-bold italic"
      >
        <span>{isOpen ? "▼" : "▶"} Manual de Operaciones</span>
      </button>
      {isOpen && (
        <div className="p-4 bg-gray-100 dark:bg-black/40 text-[10px] text-gray-600 dark:text-gray-400 space-y-4 animate-in fade-in duration-300">
          <div>
            <p className="text-yellow-600 font-bold mb-1 underline">
              REGLAS DE NOMBRES:
            </p>
            <ul className="space-y-1 ml-2">
              <li>
                • <b>Productos/Rubros:</b> Deben ser texto (Ej: SOJA). No se
                permiten solo números.
              </li>
              <li>
                • <b>Silos:</b> Pueden ser números (Ej: 1, 2) o texto.
              </li>
              <li>
                • <b>Códigos:</b> Sin espacios, solo letras y números.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

// --- 2. PANEL DE GESTIÓN ---
const PanelGestion = ({
  titulo,
  tipo,
  lista,
  editandoId,
  setEditandoId,
  onSave,
  onDelete,
  productosParaSelect = [],
  rubrosParaSelect = [],
  setSubVista,
  onVolver,
  keyId,
  keyNombre,
}: any) => {
  const schema =
    tipo === "SILO" ? siloSchema : tipo === "RXP" ? rxpSchema : baseSchema;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AdminFormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      codigo: "",
      nombre: "",
      extra: "",
      min: undefined,
      max: undefined,
    },
  });

  // Efecto para cargar datos al editar
  useEffect(() => {
    if (editandoId) {
      const item = lista.find((i: any) => {
        if (tipo === "RXP")
          return `${i.codigoprod}-${i.codigorub}` === editandoId;
        return i[keyId] === editandoId;
      });

      if (item) {
        if (tipo === "RXP") {
          reset({
            extra: item.codigoprod,
            codigo: item.codigorub,
            min: item.valmin,
            max: item.valmax,
          });
        } else if (tipo === "SILO") {
          reset({
            codigo: item.codsil,
            nombre: item.nombre,
            extra: item.codprod,
            min: item.capacidad,
          });
        } else {
          reset({ codigo: item[keyId], nombre: item[keyNombre] });
        }
      }
    } else {
      reset({
        codigo: "",
        nombre: "",
        extra: "",
        min: undefined,
        max: undefined,
      });
    }
  }, [editandoId, lista, tipo, keyId, keyNombre, reset]);

  const onSubmit: SubmitHandler<AdminFormValues> = (data) => {
    onSave(data);
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-gray-100 dark:bg-black p-4 font-mono transition-colors duration-300">
      <div className="border-2 border-cyan-500 p-6 bg-white dark:bg-[#0a0a0a] shadow-xl w-full max-w-md transition-colors duration-300 flex flex-col max-h-[95vh]">
        {/* HEADER FIJO */}
        <h3 className="text-cyan-600 dark:text-cyan-400 font-bold mb-4 text-xl tracking-widest text-center border-b border-gray-300 dark:border-cyan-900 pb-2 uppercase italic shrink-0">
          {titulo}{" "}
          {editandoId && (
            <span className="text-yellow-600 dark:text-yellow-500 text-[10px] animate-pulse block sm:inline">
              (EDITANDO)
            </span>
          )}
        </h3>

        {/* FORMULARIO (SCROLLEABLE SI ES NECESARIO EN MÓVILES MUY CHICOS) */}
        <div className="overflow-y-auto shrink-0 mb-4 px-1">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-3"
          >
            {tipo !== "RXP" && (
              <>
                <div className="flex flex-col">
                  <input
                    {...register("nombre")}
                    className={`bg-gray-50 dark:bg-black border p-3 text-cyan-700 dark:text-cyan-500 outline-none focus:border-cyan-500 uppercase text-xs placeholder-gray-400 dark:placeholder-gray-600 ${errors.nombre ? "border-red-500" : "border-gray-300 dark:border-gray-700"}`}
                    placeholder="NOMBRE / DESCRIPCIÓN"
                    autoComplete="off"
                    onChange={(e) =>
                      setValue("nombre", e.target.value.toUpperCase())
                    }
                  />
                  {errors.nombre && (
                    <span className="text-[9px] text-red-500">
                      * {errors.nombre.message}
                    </span>
                  )}
                </div>

                <div className="flex flex-col">
                  <input
                    {...register("codigo")}
                    disabled={!!editandoId}
                    className={`bg-gray-50 dark:bg-black border p-3 outline-none uppercase text-xs placeholder-gray-400 dark:placeholder-gray-600 ${editandoId ? "text-gray-400 cursor-not-allowed border-gray-200" : "text-cyan-700 dark:text-cyan-500 focus:border-cyan-500"} ${errors.codigo ? "border-red-500" : "border-gray-300 dark:border-gray-700"}`}
                    placeholder="CÓDIGO (EJ: SOJA, S1)"
                    autoComplete="off"
                    onChange={(e) =>
                      setValue(
                        "codigo",
                        e.target.value.toUpperCase().replace(/\s/g, ""),
                      )
                    }
                  />
                  {errors.codigo && (
                    <span className="text-[9px] text-red-500">
                      * {errors.codigo.message}
                    </span>
                  )}
                </div>
              </>
            )}

            {(tipo === "SILO" || tipo === "RXP") && (
              <div className="flex flex-col">
                <select
                  {...register("extra")}
                  className={`bg-gray-50 dark:bg-black border p-3 text-yellow-600 dark:text-yellow-500 text-xs outline-none focus:border-cyan-500 ${errors.extra ? "border-red-500" : "border-gray-300 dark:border-gray-700"}`}
                >
                  <option value="">-- SELECCIONE PRODUCTO --</option>
                  {productosParaSelect.map((p: Producto) => (
                    <option key={p.codigo} value={p.codigo}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
                {errors.extra && (
                  <span className="text-[9px] text-red-500">
                    * {errors.extra.message}
                  </span>
                )}
              </div>
            )}

            {tipo === "SILO" && (
              <div className="flex flex-col">
                <input
                  type="number"
                  {...register("min")}
                  className="bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 p-3 text-cyan-700 dark:text-cyan-500 outline-none focus:border-cyan-500 text-xs placeholder-gray-400 dark:placeholder-gray-600"
                  placeholder="CAPACIDAD MÁXIMA (KG)"
                />
                {errors.min && (
                  <span className="text-[9px] text-red-500">
                    * {errors.min.message}
                  </span>
                )}
              </div>
            )}

            {tipo === "RXP" && (
              <>
                <div className="flex flex-col">
                  <select
                    {...register("codigo")}
                    disabled={!!editandoId}
                    className="bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 p-3 text-cyan-700 dark:text-cyan-500 text-xs outline-none focus:border-cyan-500"
                  >
                    <option value="">-- SELECCIONE RUBRO --</option>
                    {rubrosParaSelect.map((r: Rubro) => (
                      <option key={r.codigo} value={r.codigo}>
                        {r.nombre}
                      </option>
                    ))}
                  </select>
                  {errors.codigo && (
                    <span className="text-[9px] text-red-500">
                      * {errors.codigo.message}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    {...register("min")}
                    className="bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 p-3 text-xs outline-none"
                    placeholder="MIN"
                  />
                  <input
                    type="number"
                    {...register("max")}
                    className="bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 p-3 text-xs outline-none"
                    placeholder="MAX"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              className={`mt-2 border py-3 transition-all font-bold uppercase text-xs shadow-sm ${editandoId ? "border-yellow-500 text-yellow-600 dark:text-yellow-500 hover:bg-yellow-500 hover:text-white dark:hover:text-black" : "border-cyan-500 text-cyan-600 dark:text-cyan-500 hover:bg-cyan-500 hover:text-white dark:hover:text-black"}`}
            >
              {editandoId ? "[ GUARDAR CAMBIOS ]" : "[ + AÑADIR REGISTRO ]"}
            </button>

            {editandoId && (
              <button
                type="button"
                onClick={() => setEditandoId(null)}
                className="text-[10px] text-gray-500 dark:text-gray-600 hover:text-red-500 dark:hover:text-white uppercase tracking-tighter"
              >
                ✕ CANCELAR EDICIÓN
              </button>
            )}
          </form>
        </div>

        {/* --- LISTADO TIPO CARDS --- */}
        <div className="flex-1 overflow-y-auto custom-scrollbar border-t border-gray-300 dark:border-gray-800 pt-4">
          <div className="flex flex-col gap-2">
            {" "}
            {/* Contenedor de cards */}
            {lista.length === 0 ? (
              <p className="text-center text-gray-400 text-xs italic py-4">
                No hay registros aún.
              </p>
            ) : (
              lista.map((item: any, idx: number) => {
                const idUnico =
                  tipo === "RXP"
                    ? `${item.codigoprod}-${item.codigorub}`
                    : item[keyId];

                // Lógica Nombres RxP
                let textoPrincipal;
                if (tipo === "RXP") {
                  const prodName =
                    productosParaSelect.find(
                      (p: any) => p.codigo === item.codigoprod,
                    )?.nombre || item.codigoprod;
                  const rubName =
                    rubrosParaSelect.find(
                      (r: any) => r.codigo === item.codigorub,
                    )?.nombre || item.codigorub;
                  textoPrincipal = `${prodName} ➔ ${rubName}`;
                } else {
                  textoPrincipal = item[keyNombre];
                }

                const textoSecundario =
                  tipo === "RXP"
                    ? `MIN: ${item.valmin} | MAX: ${item.valmax}`
                    : tipo === "SILO"
                      ? `CAP: ${item.capacidad} KG | PROD: ${item.codprod}`
                      : `ID: ${item[keyId]}`;

                return (
                  // CARD ITEM
                  <div
                    key={idx}
                    className="flex justify-between items-center p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-800 rounded shadow-sm hover:border-cyan-500 dark:hover:border-cyan-700 transition-all"
                  >
                    <div className="flex flex-col">
                      <span className="text-gray-900 dark:text-white font-bold text-xs uppercase">
                        {textoPrincipal}
                      </span>
                      <span className="text-cyan-700 dark:text-cyan-500 text-[10px] font-mono mt-1">
                        {textoSecundario}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 pl-2 border-l border-gray-300 dark:border-gray-700 ml-2">
                      <button
                        onClick={() => setEditandoId(idUnico)}
                        className="text-gray-500 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors"
                        title="Editar"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => onDelete(idUnico)}
                        className="text-red-400 hover:text-red-600 dark:hover:text-red-400 transition-colors font-bold"
                        title="Eliminar"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-4 pt-2 shrink-0">
          <SeccionAyuda />

          <div className="flex flex-col gap-2 mt-4">
            <button
              onClick={() => setSubVista("PRINCIPAL")}
              className="w-full bg-gray-100 dark:bg-gray-800 text-cyan-700 dark:text-cyan-500 text-[10px] uppercase py-2 font-bold hover:bg-cyan-100 dark:hover:bg-cyan-900/30 transition-colors rounded"
            >
              ▲ Volver a Menú Admin
            </button>
            <button
              onClick={onVolver}
              className="w-full text-red-700 dark:text-red-600 text-[10px] font-bold text-center uppercase hover:text-red-500 py-1"
            >
              &lt;&lt; Volver al Menú Principal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 3. COMPONENTE PRINCIPAL (AdminMenu) ---
export const AdminMenu = ({ onVolver }: { onVolver: () => void }) => {
  const [subVista, setSubVista] = useState<SubVista>("PRINCIPAL");
  const [editandoId, setEditandoId] = useState<string | null>(null);

  // DATA
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

  // MODAL
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    message: "",
  });
  const closeModal = () => setModal({ ...modal, isOpen: false });

  const handleSave = (
    data: AdminFormValues,
    tipo: "PRODUCTOS" | "RUBROS" | "SILOS" | "RXP",
  ) => {
    let nuevaLista: any[] = [];
    let setLista: any = null;
    let payload: any = null;
    let idCheck = data.codigo;

    if (tipo === "PRODUCTOS") {
      nuevaLista = productos;
      setLista = setProductos;
      payload = { codigo: data.codigo, nombre: data.nombre, estado: "A" };
    } else if (tipo === "RUBROS") {
      nuevaLista = rubros;
      setLista = setRubros;
      payload = { codigo: data.codigo, nombre: data.nombre };
    } else if (tipo === "SILOS") {
      nuevaLista = silos;
      setLista = setSilos;
      idCheck = data.codigo;
      const stockActual = editandoId
        ? silos.find((s) => s.codsil === editandoId)?.stock || 0
        : 0;
      payload = {
        codsil: data.codigo,
        nombre: data.nombre,
        codprod: data.extra,
        stock: stockActual,
        capacidad: data.min,
      };
    } else if (tipo === "RXP") {
      nuevaLista = rxp;
      setLista = setRxp;
      idCheck = `${data.extra}-${data.codigo}`;
      payload = {
        codigoprod: data.extra,
        codigorub: data.codigo,
        valmin: data.min,
        valmax: data.max,
      };
    }

    if (editandoId) {
      setLista(
        nuevaLista.map((item) => {
          const currentId =
            tipo === "RXP"
              ? `${item.codigoprod}-${item.codigorub}`
              : tipo === "SILOS"
                ? item.codsil
                : item.codigo;
          return currentId === editandoId ? payload : item;
        }),
      );
      toast.success("REGISTRO ACTUALIZADO");
      setEditandoId(null);
    } else {
      const existe = nuevaLista.find((item) => {
        const currentId =
          tipo === "RXP"
            ? `${item.codigoprod}-${item.codigorub}`
            : tipo === "SILOS"
              ? item.codsil
              : item.codigo;
        return currentId === idCheck;
      });

      if (existe) {
        toast.warning("EL CODIGO YA EXISTE");
        return;
      }
      setLista([...nuevaLista, payload]);
      toast.success("REGISTRO CREADO");
    }
  };

  const handleDelete = (
    id: string,
    tipo: "PRODUCTOS" | "RUBROS" | "SILOS" | "RXP",
  ) => {
    setModal({
      isOpen: true,
      message: `¿ELIMINAR REGISTRO ${id}?`,
      onConfirm: () => {
        if (tipo === "PRODUCTOS")
          setProductos(productos.filter((p) => p.codigo !== id));
        if (tipo === "RUBROS") setRubros(rubros.filter((r) => r.codigo !== id));
        if (tipo === "SILOS") setSilos(silos.filter((s) => s.codsil !== id));
        if (tipo === "RXP") {
          const [pId, rId] = id.split("-");
          setRxp(
            rxp.filter((r) => !(r.codigoprod === pId && r.codigorub === rId)),
          );
        }
        toast.success("ELIMINADO CORRECTAMENTE");
        closeModal();
      },
    });
  };

  if (subVista === "PRINCIPAL") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-black gap-4 font-mono transition-colors duration-300">
        <div className="border-2 border-gray-300 dark:border-white p-10 bg-white dark:bg-[#0a0a0a] flex flex-col gap-3 shadow-lg dark:shadow-[0_0_15px_rgba(255,255,255,0.1)] w-full max-w-md">
          <h2 className="text-gray-900 dark:text-white text-center mb-6 tracking-widest font-bold border-b border-gray-300 dark:border-white pb-2 uppercase italic">
            Admin Panel
          </h2>
          {["PRODUCTOS", "RUBROS", "RXP", "SILOS"].map((v) => (
            <button
              key={v}
              onClick={() => setSubVista(v as SubVista)}
              className="border border-cyan-500 p-4 w-full text-cyan-600 dark:text-cyan-500 hover:bg-cyan-500 hover:text-white dark:hover:text-black uppercase font-bold text-sm transition-all rounded shadow-sm"
            >
              {v.replace("RXP", "Rubros x Producto")}
            </button>
          ))}
          <button
            onClick={onVolver}
            className="border border-red-500 p-4 w-full text-red-600 dark:text-red-500 dark:hover:text-black hover:bg-red-500 hover:text-white uppercase font-bold text-sm mt-4 italic transition-all rounded shadow-sm"
          >
            Regresar
          </button>
        </div>
      </div>
    );
  }

  const commonProps = { editandoId, setEditandoId, setSubVista, onVolver };

  return (
    <div className="relative min-h-screen bg-gray-100 dark:bg-black font-mono transition-colors duration-300">
      <div
        className={`transition-all duration-300 ${modal.isOpen ? "opacity-50 blur-sm pointer-events-none" : ""}`}
      >
        {subVista === "PRODUCTOS" && (
          <PanelGestion
            {...commonProps}
            titulo="Productos"
            tipo="BASE"
            lista={productos}
            keyId="codigo"
            keyNombre="nombre"
            onSave={(d: any) => handleSave(d, "PRODUCTOS")}
            onDelete={(id: string) => handleDelete(id, "PRODUCTOS")}
          />
        )}
        {subVista === "RUBROS" && (
          <PanelGestion
            {...commonProps}
            titulo="Rubros"
            tipo="BASE"
            lista={rubros}
            keyId="codigo"
            keyNombre="nombre"
            onSave={(d: any) => handleSave(d, "RUBROS")}
            onDelete={(id: string) => handleDelete(id, "RUBROS")}
          />
        )}
        {subVista === "SILOS" && (
          <PanelGestion
            {...commonProps}
            titulo="Silos"
            tipo="SILO"
            lista={silos}
            keyId="codsil"
            keyNombre="nombre"
            productosParaSelect={productos}
            onSave={(d: any) => handleSave(d, "SILOS")}
            onDelete={(id: string) => handleDelete(id, "SILOS")}
          />
        )}
        {subVista === "RXP" && (
          <PanelGestion
            {...commonProps}
            titulo="Relación RxP"
            tipo="RXP"
            lista={rxp}
            productosParaSelect={productos}
            rubrosParaSelect={rubros}
            onSave={(d: any) => handleSave(d, "RXP")}
            onDelete={(id: string) => handleDelete(id, "RXP")}
          />
        )}
      </div>

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
