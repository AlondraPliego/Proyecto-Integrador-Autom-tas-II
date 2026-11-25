// Tipos del contrato de la API (docs/contratos.md, sección 6).
export type Estado = "ON" | "OFF";
export type Fase = "LEXICO" | "SINTACTICO" | "SEMANTICO" | "EJECUCION";

export interface Dispositivo {
  id: string;
  tipo: "LED" | "ALARMA" | "VENTILADOR";
  estado: Estado;
  etiqueta: string;
  operaciones: string[];
}

export interface ErrorLenguaje {
  fase: Fase;
  codigo: string;
  mensaje: string;
  linea: number | null;
  columna: number | null;
}

export interface Resultado {
  linea: number;
  instruccion: string;
  exito: boolean;
  mensaje: string;
  datos: unknown | null;
}

export interface RespuestaEjecucion {
  exito: boolean;
  error: ErrorLenguaje | null;
  tokens: unknown[] | null;
  ast: unknown | null;
  ir: unknown[] | null;
  ir_optimizado: unknown[] | null;
  optimizaciones_aplicadas: { regla: string; descripcion: string }[];
  resultados: Resultado[];
  dispositivos: Dispositivo[];
}

export interface RegistroHistorial {
  id: number;
  fecha: string;
  linea: number;
  instruccion: string;
  exito: boolean;
  mensaje: string;
}
