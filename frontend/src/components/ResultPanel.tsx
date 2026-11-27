import type { Dispositivo, Fase, RespuestaEjecucion } from "../types";

const FASES: { f: Fase; texto: string }[] = [
  { f: "LEXICO", texto: "Léxico" },
  { f: "SINTACTICO", texto: "Sintáctico" },
  { f: "SEMANTICO", texto: "Semántico" },
  { f: "EJECUCION", texto: "Ejecución" },
];

const CON_DISPOSITIVO = ["ENCENDER", "APAGAR", "ACTIVAR", "DESACTIVAR", "CONSULTAR", "SI"];

function Fases({ fallida }: { fallida: Fase | null }) {
  const corte = fallida ? FASES.findIndex((x) => x.f === fallida) : FASES.length;
  return (
    <ol className="fases">
      {FASES.map((x, i) => (
        <li key={x.f} className={i < corte ? "ok" : i === corte ? "mal" : "pendiente"}>{x.texto}</li>
      ))}
    </ol>
  );
}

export default function ResultPanel({ respuesta, errorRed }: { respuesta: RespuestaEjecucion | null; errorRed: string | null }) {
  if (errorRed)
    return (
      <section className="panel" aria-live="polite">
        <h2>Resultado</h2>
        <p className="mensaje mal">No se pudo conectar con el servidor. {errorRed}</p>
      </section>
    );
  if (!respuesta)
    return (
      <section className="panel">
        <h2>Resultado</h2>
        <p className="vacio">Escribe una instrucción y presiona Ejecutar para ver aquí cómo se analiza y se ejecuta.</p>
      </section>
    );

  const e = respuesta.error;
  return (
    <section className="panel" aria-live="polite">
      <h2>Resultado</h2>
      <Fases fallida={e ? e.fase : null} />
      {e ? (
        <div className="tarjeta mal">
          <div className="fila"><span>Fase</span><b>{e.fase}</b></div>
          <div className="fila"><span>Código</span><b>{e.codigo}</b></div>
          {e.linea && <div className="fila"><span>Posición</span><b>línea {e.linea}{e.columna ? `, columna ${e.columna}` : ""}</b></div>}
          <p className="mensaje mal">{e.mensaje}</p>
          <p className="nota">No se ejecutó ninguna instrucción.</p>
        </div>
      ) : (
        respuesta.resultados.map((r) => {
          const [op, dev] = r.instruccion.split(/\s+/);
          const lista = (r.datos as { dispositivos?: Dispositivo[] } | null)?.dispositivos;
          return (
            <div key={r.linea} className={`tarjeta ${r.exito ? "ok" : "mal"}`}>
              <div className="fila"><span>Instrucción reconocida</span><b>{op.toUpperCase()}</b></div>
              {dev && CON_DISPOSITIVO.includes(op.toUpperCase()) && (
                <div className="fila"><span>Dispositivo</span><b>{dev}</b></div>
              )}
              <div className="fila"><span>Validación</span><b>Correcta</b></div>
              <div className="fila"><span>Ejecución</span><b>{r.exito ? "Exitosa" : "Con error"}</b></div>
              <p className={`mensaje ${r.exito ? "ok" : "mal"}`}>{r.mensaje}</p>
              {lista && (
                <ul className="lista-disp">
                  {lista.map((d) => (
                    <li key={d.id}><code>{d.id}</code> ({d.tipo}): {d.etiqueta}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        })
      )}
      {respuesta.optimizaciones_aplicadas.length > 0 && (
        <p className="nota">
          Optimizaciones: {respuesta.optimizaciones_aplicadas.map((o) => o.regla).join(", ")}
        </p>
      )}
      <details className="detalle">
        <summary>Detalle técnico</summary>
        <pre>{JSON.stringify({ tokens: respuesta.tokens, ast: respuesta.ast, ir: respuesta.ir, ir_optimizado: respuesta.ir_optimizado }, null, 2)}</pre>
      </details>
    </section>
  );
}