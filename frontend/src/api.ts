import { mockDevices, mockExecute, mockHistory } from "./mock";
import type { Dispositivo, RegistroHistorial, RespuestaEjecucion } from "./types";

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";
const BASE = import.meta.env.VITE_API_URL ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(BASE + path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!r.ok) throw new Error(`El servidor respondió ${r.status}`);
  return r.json() as Promise<T>;
}

export const ejecutar = (codigo: string): Promise<RespuestaEjecucion> =>
  USE_MOCK
    ? mockExecute(codigo)
    : request("/api/execute", { method: "POST", body: JSON.stringify({ codigo, optimizar: true }) });

export const obtenerDispositivos = (): Promise<Dispositivo[]> =>
  USE_MOCK ? mockDevices() : request<{ dispositivos: Dispositivo[] }>("/api/devices").then((r) => r.dispositivos);

export const obtenerHistorial = (): Promise<RegistroHistorial[]> =>
  USE_MOCK
    ? mockHistory()
    : request<{ historial: RegistroHistorial[] }>("/api/history").then((r) => r.historial);
