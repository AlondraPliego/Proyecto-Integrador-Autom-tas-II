# CommandFlow · Frontend

React + TypeScript (Vite). Consola de instrucciones, panel de dispositivos, panel de resultado e historial.

```
npm install
npm run dev        # http://localhost:5173
```

Por defecto usa **datos simulados** (`src/mock.ts`), que siguen el contrato de `docs/contratos.md`.
Para conectarlo al backend real, crea `.env.local`:

```
VITE_USE_MOCK=false
```

En desarrollo, Vite redirige `/api` a `http://localhost:8000`. Si el backend está en otra URL, agrega `VITE_API_URL=http://host:puerto`.
