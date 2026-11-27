import type { RegistroHistorial } from "../types";

export default function HistoryPanel({ historial }: { historial: RegistroHistorial[] }) {
  return (
    <section className="panel" aria-labelledby="t-hist">
      <h2 id="t-hist">Historial</h2>
      {historial.length === 0 ? (
        <p className="vacio">Aún no se ha ejecutado ninguna instrucción.</p>
      ) : (
        <ul className="historial">
          {historial.map((h) => (
            <li key={h.id} className={h.exito ? "ok" : "mal"}>
              <code>{h.instruccion}</code>
              <span>{h.mensaje}</span>
              <time dateTime={h.fecha}>{new Date(h.fecha).toLocaleTimeString("es-MX")}</time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
