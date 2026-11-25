// Simulación del backend para trabajar sin API. Respeta docs/contratos.md.
import type { Dispositivo, ErrorLenguaje, Fase, RegistroHistorial, RespuestaEjecucion, Resultado } from "./types";

type Tipo = Dispositivo["tipo"];
const OPS: Record<Tipo, string[]> = {
  LED: ["ENCENDER", "APAGAR", "CONSULTAR"],
  ALARMA: ["ACTIVAR", "DESACTIVAR", "CONSULTAR"],
  VENTILADOR: ["ENCENDER", "APAGAR", "CONSULTAR"],
};
const ETIQ: Record<Tipo, [string, string]> = {
  LED: ["ENCENDIDO", "APAGADO"],
  ALARMA: ["ACTIVADA", "DESACTIVADA"],
  VENTILADOR: ["ENCENDIDO", "APAGADO"],
};
const etiqueta = (t: Tipo, e: "ON" | "OFF") => ETIQ[t][e === "ON" ? 0 : 1];
const nuevo = (id: string, tipo: Tipo, estado: "ON" | "OFF"): Dispositivo => ({
  id, tipo, estado, etiqueta: etiqueta(tipo, estado), operaciones: OPS[tipo],
});

let devs: Dispositivo[] = [
  nuevo("led1", "LED", "OFF"), nuevo("led2", "LED", "ON"),
  nuevo("alarma1", "ALARMA", "ON"), nuevo("ventilador1", "VENTILADOR", "OFF"),
];
let historial: RegistroHistorial[] = [];

type Cmd =
  | { k: "ctrl"; op: string; id: string }
  | { k: "listar" }
  | { k: "notificar"; msg: string }
  | { k: "correo"; to: string; msg: string };
type Instr = Cmd | { k: "si"; id: string; neq: boolean; valor: string; entonces: Cmd };
type Falla = Omit<ErrorLenguaje, "linea">;
const falla = (fase: Fase, codigo: string, mensaje: string, columna: number | null = 1): Falla =>
  ({ fase, codigo, mensaje, columna });

const CTRL = ["ENCENDER", "APAGAR", "ACTIVAR", "DESACTIVAR", "CONSULTAR"];

function comando(txt: string): Cmd | Falla {
  const t = txt.trim().split(/\s+/);
  const op = t[0].toUpperCase();
  if (CTRL.includes(op)) {
    if (t.length < 2) return falla("SINTACTICO", "SYN_ESPERADO_IDENTIFICADOR", "Se esperaba un identificador de dispositivo.");
    if (t.length > 2) return falla("SINTACTICO", "SYN_TOKEN_INESPERADO", `Token inesperado '${t[2]}'.`);
    return { k: "ctrl", op, id: t[1] };
  }
  if (op === "LISTAR")
    return t[1]?.toUpperCase() === "DISPOSITIVOS" && t.length === 2
      ? { k: "listar" }
      : falla("SINTACTICO", "SYN_TOKEN_INESPERADO", "Se esperaba DISPOSITIVOS.");
  if (op === "NOTIFICAR") {
    const m = txt.trim().match(/^NOTIFICAR\s+"([^"]*)"$/i);
    return m ? { k: "notificar", msg: m[1] } : falla("SINTACTICO", "SYN_ESPERADO_CADENA", "Se esperaba un mensaje entre comillas.");
  }
  if (op === "ENVIAR") {
    const m = txt.trim().match(/^ENVIAR\s+CORREO\s+A\s+"([^"]*)"\s+MENSAJE\s+"([^"]*)"$/i);
    return m ? { k: "correo", to: m[1], msg: m[2] } : falla("SINTACTICO", "SYN_TOKEN_INESPERADO", "Se esperaba: ENVIAR CORREO A \"correo\" MENSAJE \"texto\".");
  }
  return falla("SINTACTICO", "SYN_TOKEN_INESPERADO", `Instrucción desconocida '${t[0]}'.`);
}

function analizar(linea: string): Instr | Falla {
  const sinCadenas = linea.replace(/"[^"]*"/g, (m) => " ".repeat(m.length));
  const mal = sinCadenas.search(/[^A-Za-z0-9_\s=!]/);
  if (mal >= 0) return falla("LEXICO", "LEX_CARACTER_INVALIDO", `Carácter '${linea[mal]}' no reconocido.`, mal + 1);
  if ((linea.match(/"/g) ?? []).length % 2)
    return falla("LEXICO", "LEX_CADENA_SIN_CERRAR", "Cadena sin cerrar.", linea.indexOf('"') + 1);
  const si = linea.trim().match(/^SI\s+(\w+)\s*(==|!=)\s*(\w+)\s+ENTONCES\s+(.+)$/i);
  if (si) {
    const c = comando(si[4]);
    return "fase" in c ? c : { k: "si", id: si[1], neq: si[2] === "!=", valor: si[3].toUpperCase(), entonces: c };
  }
  if (/^SI\b/i.test(linea.trim())) return falla("SINTACTICO", "SYN_ESPERADO_ESTADO", "Se esperaba: SI id == ESTADO ENTONCES comando.");
  return comando(linea);
}

const buscar = (id: string) => devs.find((d) => d.id === id);

function validar(c: Cmd): Falla | null {
  if (c.k === "ctrl") {
    const d = buscar(c.id);
    if (!d) return falla("SEMANTICO", "SEM_DISPOSITIVO_NO_EXISTE", `El dispositivo '${c.id}' no existe.`);
    if (!d.operaciones.includes(c.op))
      return falla("SEMANTICO", "SEM_OPERACION_INCOMPATIBLE", `${d.id} no admite ${c.op}. Operaciones: ${d.operaciones.join(", ")}.`);
  }
  if (c.k === "correo" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.to))
    return falla("SEMANTICO", "SEM_CORREO_INVALIDO", `'${c.to}' no tiene formato de correo.`);
  return null;
}

function validarInstr(i: Instr): Falla | null {
  if (i.k !== "si") return validar(i);
  const d = buscar(i.id);
  if (!d) return falla("SEMANTICO", "SEM_DISPOSITIVO_NO_EXISTE", `El dispositivo '${i.id}' no existe.`);
  if (!ETIQ[d.tipo].includes(i.valor))
    return falla("SEMANTICO", "SEM_ESTADO_INCOMPATIBLE", `${d.id} (${d.tipo}) no puede compararse con ${i.valor}.`);
  return validar(i.entonces);
}

function correr(c: Cmd): { mensaje: string; datos: unknown } {
  if (c.k === "ctrl") {
    const d = buscar(c.id)!;
    if (c.op === "CONSULTAR") return { mensaje: `${d.id} está ${d.etiqueta}`, datos: { dispositivo: { ...d } } };
    d.estado = ["ENCENDER", "ACTIVAR"].includes(c.op) ? "ON" : "OFF";
    d.etiqueta = etiqueta(d.tipo, d.estado);
    return { mensaje: `${d.id} ahora está ${d.etiqueta}`, datos: null };
  }
  if (c.k === "listar") return { mensaje: `${devs.length} dispositivos`, datos: { dispositivos: devs.map((d) => ({ ...d })) } };
  if (c.k === "notificar") return { mensaje: `Notificación registrada: "${c.msg}"`, datos: null };
  return { mensaje: `Correo enviado a ${c.to} (simulado)`, datos: null };
}

const pausa = () => new Promise((r) => setTimeout(r, 150));
const copia = () => devs.map((d) => ({ ...d }));

export async function mockExecute(codigo: string): Promise<RespuestaEjecucion> {
  await pausa();
  const lineas = codigo.split("\n").map((t, i) => ({ t: t.trim(), n: i + 1 })).filter((l) => l.t);
  const programa: { n: number; t: string; i: Instr }[] = [];
  const fallo = (f: Falla, n: number): RespuestaEjecucion => ({
    exito: false,
    error: { ...f, linea: n },
    tokens: f.fase === "LEXICO" ? null : [],
    ast: f.fase === "LEXICO" || f.fase === "SINTACTICO" ? null : {},
    ir: null, ir_optimizado: null,
    optimizaciones_aplicadas: [], resultados: [], dispositivos: [],
  });
  for (const l of lineas) {
    const r = analizar(l.t);
    if ("fase" in r) return fallo(r, l.n);
    programa.push({ ...l, i: r });
  }
  for (const p of programa) {
    const f = validarInstr(p.i);
    if (f) return fallo(f, p.n);
  }
  const resultados: Resultado[] = programa.map((p) => {
    let r: { mensaje: string; datos: unknown };
    if (p.i.k !== "si") r = correr(p.i);
    else {
      const d = buscar(p.i.id)!;
      const cumple = (d.etiqueta === p.i.valor) !== p.i.neq;
      r = cumple ? correr(p.i.entonces) : { mensaje: "Condición no cumplida, no se ejecutó la acción", datos: null };
    }
    historial.unshift({
      id: (historial[0]?.id ?? 0) + 1, fecha: new Date().toISOString(),
      linea: p.n, instruccion: p.t, exito: true, mensaje: r.mensaje,
    });
    return { linea: p.n, instruccion: p.t, exito: true, ...r };
  });
  return {
    exito: true, error: null, tokens: [], ast: {}, ir: [], ir_optimizado: [],
    optimizaciones_aplicadas: [], resultados, dispositivos: copia(),
  };
}

export const mockDevices = async () => copia();
export const mockHistory = async () => [...historial];
