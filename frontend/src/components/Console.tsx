interface Props {
  codigo: string;
  cargando: boolean;
  onChange: (v: string) => void;
  onEjecutar: () => void;
}

const EJEMPLOS = [
  "ENCENDER led1",
  "APAGAR led1",
  "DESACTIVAR alarma1",
  "CONSULTAR led2",
  "LISTAR DISPOSITIVOS",
  'NOTIFICAR "Prueba"',
  'ENVIAR CORREO A "usuario@ejemplo.com" MENSAJE "Hola"',
  "SI led1 == ENCENDIDO ENTONCES APAGAR led1",
  "ENCENDER alarma1",
  "ENCENDER led1@",
];

export default function Console({ codigo, cargando, onChange, onEjecutar }: Props) {
  return (
    <section className="panel" aria-labelledby="t-cons">
      <h2 id="t-cons">Consola de instrucciones</h2>
      <textarea
        className="consola"
        value={codigo}
        rows={5}
        spellCheck={false}
        placeholder="Escribe una instrucción por línea"
        aria-label="Instrucciones"
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) onEjecutar();
        }}
      />
      <div className="acciones">
        <button className="ejecutar" onClick={onEjecutar} disabled={cargando || !codigo.trim()}>
          {cargando ? "Ejecutando…" : "Ejecutar"}
        </button>
        <span className="atajo">Ctrl + Enter</span>
      </div>
      <div className="ejemplos" aria-label="Ejemplos">
        {EJEMPLOS.map((e) => (
          <button key={e} className="ejemplo" onClick={() => onChange(e)}>{e}</button>
        ))}
      </div>
    </section>
  );
}
