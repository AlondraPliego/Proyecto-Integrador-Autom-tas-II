import type { Dispositivo } from "../types";

const nombre = (id: string) =>
  id.replace(/^([a-z]+)(\d+)$/i, (_, a: string, n: string) => `${a.toUpperCase()} ${n}`);

export default function DevicePanel({ dispositivos }: { dispositivos: Dispositivo[] }) {
  return (
    <section className="panel" aria-labelledby="t-disp">
      <h2 id="t-disp">Dispositivos</h2>
      <div className="dispositivos">
        {dispositivos.map((d) => (
          <article key={d.id} className={`disp ${d.estado === "ON" ? "on" : "off"}`}>
            <span className="luz" aria-hidden="true" />
            <div>
              <div className="disp-nombre">{nombre(d.id)}</div>
              <div className="disp-estado">{d.etiqueta}</div>
              <div className="disp-id">{d.id}</div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}