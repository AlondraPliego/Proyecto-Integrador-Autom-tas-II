import { useCallback, useEffect, useState } from "react";
import { ejecutar, obtenerDispositivos, obtenerHistorial } from "./api";
import Console from "./components/Console";
import DevicePanel from "./components/DevicePanel";
import HistoryPanel from "./components/HistoryPanel";
import ResultPanel from "./components/ResultPanel";
import type { Dispositivo, RegistroHistorial, RespuestaEjecucion } from "./types";

export default function App() {
  const [codigo, setCodigo] = useState("ENCENDER led1");
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [historial, setHistorial] = useState<RegistroHistorial[]>([]);
  const [respuesta, setRespuesta] = useState<RespuestaEjecucion | null>(null);
  const [cargando, setCargando] = useState(false);
  const [errorRed, setErrorRed] = useState<string | null>(null);

  const refrescar = useCallback(async () => {
    const [d, h] = await Promise.all([obtenerDispositivos(), obtenerHistorial()]);
    setDispositivos(d);
    setHistorial(h);
  }, []);

  useEffect(() => {
    refrescar().catch((e: Error) => setErrorRed(e.message));
  }, [refrescar]);

  const onEjecutar = async () => {
    setCargando(true);
    setErrorRed(null);
    try {
      setRespuesta(await ejecutar(codigo));
      await refrescar();
    } catch (e) {
      setErrorRed((e as Error).message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="app">
      <header className="cabecera">
        <h1>CommandFlow</h1>
        <p>Centro de control por instrucciones</p>
      </header>
      <div className="rejilla">
        <div className="columna">
          <DevicePanel dispositivos={dispositivos} />
          <Console codigo={codigo} cargando={cargando} onChange={setCodigo} onEjecutar={onEjecutar} />
        </div>
        <div className="columna">
          <ResultPanel respuesta={respuesta} errorRed={errorRed} />
          <HistoryPanel historial={historial} />
        </div>
      </div>
    </main>
  );
}
