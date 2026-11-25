# Contratos del lenguaje CommandFlow

**Versión:** 1.1 (borrador para aprobación) · **Tarjeta:** TK-03

Este documento fija los formatos de datos que se intercambian entre los módulos del sistema. Una vez aprobado, **cualquier cambio requiere un Pull Request que lo modifique y la aprobación del equipo**, para que lexer, parser, semántico, generador de IR, ejecutor, API y frontend no se desincronicen.

```
Texto → Lexer → Tokens → Parser → AST → Semántico → Instrucciones semánticas → Generador IR → IR → Optimizador → IR optimizado → VM → Respuesta API
```

## 0. Convenciones generales

- Los **nombres de campos JSON** van en español y en `snake_case` (`tipo`, `linea`, `dispositivo`, `estado_destino`).
- Los **códigos de operación del IR** y las **rutas de la API** van en inglés (`SET_STATE`, `/api/execute`), como pide el enunciado.
- `linea` y `columna` empiezan en **1**.
- Codificación: UTF-8.
- **Estados internos:** todo dispositivo guarda su estado como `"ON"` u `"OFF"`. Lo que ve el usuario (`ENCENDIDO`, `APAGADO`, `ACTIVADA`, `DESACTIVADA`) es solo una etiqueta según el tipo de dispositivo (sección 1).

## 1. Catálogo de comandos

| Comando | Forma | Ejemplo | Efecto |
|---|---|---|---|
| ENCENDER | `ENCENDER <id>` | `ENCENDER led1` | Estado → `ON` |
| APAGAR | `APAGAR <id>` | `APAGAR led1` | Estado → `OFF` |
| ACTIVAR | `ACTIVAR <id>` | `ACTIVAR alarma1` | Estado → `ON` |
| DESACTIVAR | `DESACTIVAR <id>` | `DESACTIVAR alarma1` | Estado → `OFF` |
| CONSULTAR | `CONSULTAR <id>` | `CONSULTAR led1` | Devuelve el estado |
| LISTAR | `LISTAR DISPOSITIVOS` | `LISTAR DISPOSITIVOS` | Devuelve todos los dispositivos |
| NOTIFICAR | `NOTIFICAR "<texto>"` | `NOTIFICAR "Prueba"` | Registra una notificación |
| ENVIAR CORREO | `ENVIAR CORREO A "<correo>" MENSAJE "<texto>"` | `ENVIAR CORREO A "a@b.com" MENSAJE "Hola"` | Envía correo vía SMTP (Mailpit) |
| SI | `SI <id> == <ESTADO> ENTONCES <comando>` | `SI led1 == ENCENDIDO ENTONCES APAGAR led1` | Ejecuta el comando si se cumple la condición |

Reglas del programa:

- Un programa son una o más instrucciones separadas por salto de línea. Las líneas en blanco se ignoran.
- Dentro de `ENTONCES` solo se permite un comando simple (no otro `SI`).
- `REPETIR` es **opcional** y queda fuera de la versión 1.x de este contrato. Si el equipo lo implementa, se agrega como versión 1.2.

### Dispositivos iniciales (tabla de símbolos)

| id | tipo | estado inicial | operaciones permitidas | valores de estado válidos en `SI` |
|---|---|---|---|---|
| led1 | LED | OFF | ENCENDER, APAGAR, CONSULTAR | ENCENDIDO, APAGADO |
| led2 | LED | ON | ENCENDER, APAGAR, CONSULTAR | ENCENDIDO, APAGADO |
| alarma1 | ALARMA | ON | ACTIVAR, DESACTIVAR, CONSULTAR | ACTIVADA, DESACTIVADA |
| ventilador1 | VENTILADOR | OFF | ENCENDER, APAGAR, CONSULTAR | ENCENDIDO, APAGADO |

Etiquetas por tipo: LED y VENTILADOR usan `ON → ENCENDIDO` y `OFF → APAGADO`; ALARMA usa `ON → ACTIVADA` y `OFF → DESACTIVADA`.

## 2. Contrato de tokens (salida del lexer)

### Reglas léxicas

| Elemento | Regla |
|---|---|
| Palabras reservadas | `ENCENDER`, `APAGAR`, `ACTIVAR`, `DESACTIVAR`, `CONSULTAR`, `LISTAR`, `DISPOSITIVOS`, `NOTIFICAR`, `ENVIAR`, `CORREO`, `A`, `MENSAJE`, `SI`, `ENTONCES` (no distinguen mayúsculas/minúsculas) |
| Estados | `ENCENDIDO`, `APAGADO`, `ACTIVADA`, `DESACTIVADA` (no distinguen mayúsculas/minúsculas) |
| Identificador | `[A-Za-z_][A-Za-z0-9_]*` (distingue mayúsculas; no puede ser palabra reservada) |
| Cadena | Texto entre comillas dobles `"..."`, sin saltos de línea |
| Operadores | `==` y `!=` |
| Espacios y tabulaciones | Se ignoran |
| Salto de línea | Token `SALTO_LINEA` |

### Tipos de token

Los comandos llevan el prefijo `COMANDO_` para coincidir con la figura del enunciado: `COMANDO_ENCENDER`, `COMANDO_APAGAR`, `COMANDO_ACTIVAR`, `COMANDO_DESACTIVAR`, `COMANDO_CONSULTAR`, `COMANDO_LISTAR`, `COMANDO_NOTIFICAR`, `COMANDO_ENVIAR`.

El resto de palabras reservadas es su propio tipo: `DISPOSITIVOS`, `CORREO`, `A`, `MENSAJE`, `SI`, `ENTONCES`.

Además: `ESTADO`, `IDENTIFICADOR`, `CADENA`, `OP_IGUAL`, `OP_DIFERENTE`, `SALTO_LINEA`, `EOF`.

### Formato

```json
{
  "tipo": "IDENTIFICADOR",
  "lexema": "led1",
  "valor": "led1",
  "linea": 1,
  "columna": 10
}
```

- `lexema`: texto exacto tal como lo escribió el usuario.
- `valor`: palabras reservadas y estados en **MAYÚSCULAS** (en los comandos, el nombre sin prefijo: `"ENCENDER"`); cadenas **sin comillas**; el resto igual al lexema; `null` en `SALTO_LINEA` y `EOF`.
- La lista de tokens siempre termina con un token `EOF`.

**Ejemplo** para `ENCENDER led1`:

```json
[
  { "tipo": "COMANDO_ENCENDER", "lexema": "ENCENDER", "valor": "ENCENDER", "linea": 1, "columna": 1 },
  { "tipo": "IDENTIFICADOR", "lexema": "led1", "valor": "led1", "linea": 1, "columna": 10 },
  { "tipo": "EOF", "lexema": "", "valor": null, "linea": 1, "columna": 14 }
]
```

## 3. Contrato del AST (salida del parser)

El AST solo refleja la **estructura**. Todavía no se sabe si los dispositivos existen.

### Nodos

| `tipo` | Campos |
|---|---|
| `Programa` | `instrucciones`: lista de nodos |
| `ComandoDispositivo` | `operacion` (`ENCENDER`, `APAGAR`, `ACTIVAR`, `DESACTIVAR`, `CONSULTAR`), `dispositivo`, `pos` |
| `ComandoListar` | `objetivo` (`"DISPOSITIVOS"`), `pos` |
| `ComandoNotificar` | `mensaje`, `pos` |
| `ComandoCorreo` | `destinatario`, `mensaje`, `pos` |
| `Condicional` | `condicion`, `entonces` (un nodo de comando), `pos` |
| `Condicion` | `dispositivo`, `operador` (`"=="` o `"!="`), `valor` (`ENCENDIDO`, `APAGADO`, `ACTIVADA`, `DESACTIVADA`) |

`pos` tiene el formato `{ "linea": 1, "columna": 1 }` y apunta al primer token del nodo.

**Ejemplo** para `SI led1 == ENCENDIDO ENTONCES APAGAR led1`:

```json
{
  "tipo": "Programa",
  "instrucciones": [
    {
      "tipo": "Condicional",
      "pos": { "linea": 1, "columna": 1 },
      "condicion": {
        "tipo": "Condicion",
        "dispositivo": "led1",
        "operador": "==",
        "valor": "ENCENDIDO"
      },
      "entonces": {
        "tipo": "ComandoDispositivo",
        "operacion": "APAGAR",
        "dispositivo": "led1",
        "pos": { "linea": 1, "columna": 31 }
      }
    }
  ]
}
```

## 4. Contrato de instrucción semántica (salida del análisis semántico)

Es el AST **ya validado** contra la tabla de símbolos, con los estados normalizados a `ON`/`OFF`. Es la entrada del generador de IR.

Salida: `{ "instrucciones": [ ... ] }`.

| `tipo` | Campos |
|---|---|
| `CONTROL_DISPOSITIVO` | `operacion`, `dispositivo`, `estado_destino` (`"ON"` u `"OFF"`), `linea` |
| `CONSULTA_DISPOSITIVO` | `operacion` (`"CONSULTAR"`), `dispositivo`, `linea` |
| `LISTADO` | `operacion` (`"LISTAR"`), `objetivo` (`"DISPOSITIVOS"`), `linea` |
| `NOTIFICACION` | `mensaje`, `linea` |
| `CORREO` | `destinatario`, `mensaje`, `linea` |
| `CONDICIONAL` | `condicion` (`dispositivo`, `operador`, `valor` en `ON`/`OFF`), `entonces` (otra instrucción semántica), `linea` |

**Ejemplo** para `ENCENDER led1`:

```json
{
  "tipo": "CONTROL_DISPOSITIVO",
  "operacion": "ENCENDER",
  "dispositivo": "led1",
  "estado_destino": "ON",
  "linea": 1
}
```

### Validaciones semánticas

| Código | Cuándo ocurre | Ejemplo |
|---|---|---|
| `SEM_DISPOSITIVO_NO_EXISTE` | El id no está en la tabla de símbolos | `ENCENDER dispositivo99` |
| `SEM_OPERACION_INCOMPATIBLE` | La operación no está permitida para ese tipo | `ENCENDER alarma1` |
| `SEM_ESTADO_INCOMPATIBLE` | El estado de la condición no corresponde al tipo | `SI led1 == ACTIVADA ENTONCES ...` |
| `SEM_CORREO_INVALIDO` | El destinatario no tiene formato de correo | `ENVIAR CORREO A "hola" MENSAJE "x"` |

En un `SI`, el análisis semántico valida **la condición y también el comando de `ENTONCES`**. Por ejemplo, `SI led1 == ENCENDIDO ENTONCES ENCENDER alarma1` produce `SEM_OPERACION_INCOMPATIBLE`.

## 5. Contrato del IR (código intermedio)

El IR es una **lista plana** de instrucciones numeradas.

```json
{ "idx": 0, "op": "SET_STATE", "args": { "device": "led1", "value": "ON" } }
```

### Instrucciones

| `op` | `args` | Descripción |
|---|---|---|
| `GET_STATE` | `device`, `dest`, `emit` | Lee el estado de un dispositivo y lo guarda en el registro `dest` (`t0`, `t1`...). Si `emit` es `true`, también lo reporta como resultado (se usa en `CONSULTAR`). |
| `SET_STATE` | `device`, `value` | Asigna `"ON"` u `"OFF"`. Es idempotente. |
| `COMPARE` | `left`, `operator`, `right`, `dest` | Compara un registro con un valor y guarda `true`/`false` en `dest`. |
| `JUMP_IF_FALSE` | `cond`, `target` | Si el registro `cond` es `false`, salta a la instrucción con `idx` igual a `target`. |
| `NOTIFY` | `message` | Registra una notificación. |
| `SEND_EMAIL` | `to`, `message` | Solicita el envío de un correo al servicio SMTP. |
| `LIST_DEVICES` | (vacío) | Reporta todos los dispositivos. Se agregó a la lista del enunciado para poder implementar `LISTAR`. |
| `HALT` | (vacío) | Fin del programa. Siempre es la última instrucción. |

**Ejemplo** para `SI led1 == ENCENDIDO ENTONCES APAGAR led1`:

```json
[
  { "idx": 0, "op": "GET_STATE", "args": { "device": "led1", "dest": "t0", "emit": false } },
  { "idx": 1, "op": "COMPARE", "args": { "left": "t0", "operator": "==", "right": "ON", "dest": "t1" } },
  { "idx": 2, "op": "JUMP_IF_FALSE", "args": { "cond": "t1", "target": 4 } },
  { "idx": 3, "op": "SET_STATE", "args": { "device": "led1", "value": "OFF" } },
  { "idx": 4, "op": "HALT", "args": {} }
]
```

### Reglas para el optimizador

- Después de eliminar instrucciones, se **renumeran** los `idx` y se **actualizan** los `target` de los saltos.
- Las optimizaciones solo se aplican a tramos de instrucciones **sin saltos** entre ellas, y **ninguna optimización cruza una instrucción que sea destino de un salto** (un `target` de `JUMP_IF_FALSE`).
- `SEND_EMAIL` y `NOTIFY` **nunca** se eliminan ni se reordenan.
- No se elimina un `SET_STATE` si hay un `GET_STATE` del mismo dispositivo entre él y la siguiente asignación.
- El optimizador devuelve además la lista de reglas aplicadas (ver sección 6).

## 6. Contrato de la API

Base: `/api`. Formato: JSON.

| Método y ruta | Uso |
|---|---|
| `POST /api/analyze` | Valida el código y devuelve tokens, AST e IR **sin ejecutar** |
| `POST /api/execute` | Valida, genera IR, optimiza y ejecuta |
| `GET /api/devices` | Lista los dispositivos y sus estados |
| `GET /api/history` | Historial de instrucciones ejecutadas |

`GET /api/devices` devuelve `{ "dispositivos": [ ... ] }`.

### Dispositivo

```json
{
  "id": "led1",
  "tipo": "LED",
  "estado": "ON",
  "etiqueta": "ENCENDIDO",
  "operaciones": ["ENCENDER", "APAGAR", "CONSULTAR"]
}
```

### Petición a `/api/execute` y `/api/analyze`

```json
{
  "codigo": "ENCENDER led1\nAPAGAR led2",
  "optimizar": true
}
```

### Respuesta exitosa

```json
{
  "exito": true,
  "error": null,
  "tokens": [],
  "ast": {},
  "ir": [],
  "ir_optimizado": [],
  "optimizaciones_aplicadas": [
    { "regla": "ELIMINAR_REDUNDANTE", "descripcion": "SET_STATE led1 ON duplicado en idx 1" }
  ],
  "resultados": [
    {
      "linea": 1,
      "instruccion": "ENCENDER led1",
      "exito": true,
      "mensaje": "led1 ahora está ENCENDIDO",
      "datos": null
    }
  ],
  "dispositivos": []
}
```

- `datos` es `null` en las instrucciones de control. En `CONSULTAR` trae `{ "dispositivo": { ... } }`; en `LISTAR`, `{ "dispositivos": [ ... ] }`.
- `dispositivos` siempre trae el estado **final** de todos los dispositivos, para refrescar el panel del frontend.
- `/api/analyze` devuelve la misma estructura, pero con `resultados` en `[]` y sin modificar ningún estado.
- **Condición no cumplida:** si el `SI` no se cumple, esa instrucción devuelve `exito: true`, `datos: null` y `mensaje: "Condición no cumplida, no se ejecutó la acción"`.

### Respuesta con error

```json
{
  "exito": false,
  "error": {
    "fase": "LEXICO",
    "codigo": "LEX_CARACTER_INVALIDO",
    "mensaje": "Carácter '@' no reconocido.",
    "linea": 1,
    "columna": 14
  },
  "tokens": null,
  "ast": null,
  "ir": null,
  "ir_optimizado": null,
  "optimizaciones_aplicadas": [],
  "resultados": [],
  "dispositivos": []
}
```

**Fases parciales.** Las fases que sí terminaron se devuelven llenas y las demás en `null`, para que el panel muestre hasta dónde llegó el análisis:

| `error.fase` | `tokens` | `ast` | `ir` / `ir_optimizado` |
|---|---|---|---|
| `LEXICO` | `null` | `null` | `null` |
| `SINTACTICO` | lleno | `null` | `null` |
| `SEMANTICO` | lleno | lleno | `null` |
| `EJECUCION` | lleno | lleno | lleno |

### Catálogo de errores

| `fase` | `codigo` | Ejemplo |
|---|---|---|
| `LEXICO` | `LEX_CARACTER_INVALIDO` | `ENCENDER led1@` |
| `LEXICO` | `LEX_CADENA_SIN_CERRAR` | `NOTIFICAR "hola` |
| `SINTACTICO` | `SYN_ESPERADO_IDENTIFICADOR` | `ENCENDER` |
| `SINTACTICO` | `SYN_ESPERADO_ESTADO` | `SI led1 ==` |
| `SINTACTICO` | `SYN_ESPERADO_CADENA` | `NOTIFICAR` |
| `SINTACTICO` | `SYN_TOKEN_INESPERADO` | `ENCENDER led1 led2` |
| `SEMANTICO` | `SEM_DISPOSITIVO_NO_EXISTE` | `ENCENDER dispositivo99` |
| `SEMANTICO` | `SEM_OPERACION_INCOMPATIBLE` | `ENCENDER alarma1` |
| `SEMANTICO` | `SEM_ESTADO_INCOMPATIBLE` | `SI led1 == ACTIVADA ENTONCES APAGAR led1` |
| `SEMANTICO` | `SEM_CORREO_INVALIDO` | `ENVIAR CORREO A "hola" MENSAJE "x"` |
| `EJECUCION` | `EXE_ERROR_SMTP` | Mailpit no disponible |

### Historial

`GET /api/history` devuelve `{ "historial": [ ... ] }`, del más reciente al más antiguo.

**Decisión de diseño:** el historial guarda **un registro por instrucción del programa original** (la que escribió el usuario), con su resultado. **No** guarda un evento por cada `SET_STATE` del IR. Por eso los cambios intermedios de estado no son observables y la optimización de asignaciones sobrescritas conserva el comportamiento visible. Esta decisión se justifica también en la documentación de optimizaciones.

```json
{
  "id": 12,
  "fecha": "2026-11-24T18:30:00Z",
  "linea": 1,
  "instruccion": "ENCENDER led1",
  "exito": true,
  "mensaje": "led1 ahora está ENCENDIDO"
}
```

### Decisiones de comportamiento

1. **Errores del lenguaje devuelven HTTP 200** con `exito: false`, porque son un resultado esperado del sistema. Se usa `422` solo si el cuerpo de la petición es inválido (falta `codigo`) y `500` solo ante fallos inesperados.
2. **Se valida todo el programa antes de ejecutar.** Si hay un error léxico, sintáctico o semántico en cualquier línea, **no se ejecuta nada**.
3. **Errores en ejecución** (por ejemplo, SMTP caído) detienen la ejecución en esa instrucción. Los cambios hechos antes se conservan.
4. Solo se reporta el **primer error** encontrado.

## 7. Aprobación del equipo

Cada integrante marca su aprobación con una revisión **Approve** en el Pull Request que sube este documento.

| Integrante | Usuario GitHub | Aprobado | Fecha |
|---|---|---|---|
| | | [ ] | |
| | | [ ] | |
| | | [ ] | |
| | | [ ] | |
| | | [ ] | |
| | | [ ] | |
