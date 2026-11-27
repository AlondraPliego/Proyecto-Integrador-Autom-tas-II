# Evidencia de pruebas funcionales (sección 16 del enunciado)

Cada escenario se prueba escribiendo la entrada en la consola de la interfaz y capturando el panel de resultado.
Las capturas van en `docs/img/pruebas/` con el nombre indicado en la tabla.

**Cómo registrar cada prueba:**
1. Deja los dispositivos en su estado inicial (led1 apagado, led2 encendido, alarma1 activada, ventilador1 apagado) recargando la página con el mock, o reiniciando la base de datos con el backend real.
2. Escribe la entrada en la consola y presiona **Ejecutar**.
3. Captura la pantalla completa (panel de dispositivos y de resultado) y guárdala con el nombre de la tabla.
4. Marca la casilla de estado.

| # | Entrada | Resultado esperado | Fase / código esperado | Captura | Estado |
|---|---|---|---|---|---|
| 1 | `ENCENDER led1` | LED encendido | Éxito. LED 1 en verde | `01-encender-led1.png` | [ ] |
| 2 | `APAGAR led1` | LED apagado | Éxito. LED 1 apagado | `02-apagar-led1.png` | [ ] |
| 3 | `ACTIVAR alarma1` | Alarma activada | Éxito. ALARMA 1 activada | `03-activar-alarma1.png` | [ ] |
| 4 | `DESACTIVAR alarma1` | Alarma desactivada | Éxito. ALARMA 1 desactivada | `04-desactivar-alarma1.png` | [ ] |
| 5 | `CONSULTAR led1` | Estado actual | Éxito. Mensaje con el estado de led1 | `05-consultar-led1.png` | [ ] |
| 6 | `LISTAR DISPOSITIVOS` | Lista de dispositivos | Éxito. Lista con los 4 dispositivos | `06-listar-dispositivos.png` | [ ] |
| 7 | `ENCENDER dispositivo99` | Error semántico | `SEMANTICO` / `SEM_DISPOSITIVO_NO_EXISTE` | `07-dispositivo99.png` | [ ] |
| 8 | `ENCENDER alarma1` | Error de operación incompatible | `SEMANTICO` / `SEM_OPERACION_INCOMPATIBLE` | `08-encender-alarma1.png` | [ ] |
| 9 | `ENCENDER` | Error sintáctico | `SINTACTICO` / `SYN_ESPERADO_IDENTIFICADOR` | `09-encender-solo.png` | [ ] |
| 10 | `ENCENDER led1@` | Error léxico | `LEXICO` / `LEX_CARACTER_INVALIDO` | `10-led1-arroba.png` | [ ] |
| 11 | `NOTIFICAR "Prueba"` | Notificación registrada | Éxito. Mensaje de notificación registrada | `11-notificar.png` | [ ] |
| 12 | `ENVIAR CORREO A "usuario@ejemplo.com" MENSAJE "Hola"` | Correo visible en SMTP de pruebas | Éxito. Además, captura de la bandeja de Mailpit (`http://localhost:8025`) | `12-correo.png` y `12-mailpit.png` | [ ] |
| 13 | `SI led1 == ENCENDIDO ENTONCES APAGAR led1` | Ejecución condicional | Éxito. Con led1 encendido, se apaga; con led1 apagado, "Condición no cumplida" | `13-condicional-cumple.png` y `13-condicional-no-cumple.png` | [ ] |

## Notas por escenario

- **Escenario 13:** primero ejecutar `ENCENDER led1` para que se cumpla la condición. Luego ejecutar el `SI` y capturar. Repetirlo con led1 apagado para capturar el caso "Condición no cumplida".
- **Escenario 12:** solo se puede demostrar con el backend real y Mailpit en Docker. Con los datos simulados (mock) el correo es ficticio y no cuenta como evidencia.
- **Errores:** en los escenarios 7 a 10 el panel de resultado debe mostrar la fase fallida en rojo y el mensaje de error, y no se debe ejecutar ninguna instrucción.

## Pruebas adicionales de la interfaz

| Prueba | Entrada | Resultado esperado | Estado |
|---|---|---|---|
| Programa de varias líneas | `ENCENDER led1` y en otra línea `APAGAR led2` | Dos tarjetas de resultado y dos filas nuevas en el historial | [ ] |
| Error en una línea del programa | `ENCENDER led1` y en otra línea `ENCENDER led1@` | Error léxico y no se ejecuta ninguna línea (led1 no cambia) | [ ] |
| Estado visual | `ENCENDER ventilador1` | VENTILADOR 1 en verde | [ ] |
| Operación no permitida | `ACTIVAR ventilador1` | `SEM_OPERACION_INCOMPATIBLE` | [ ] |
| Atajo de teclado | `Ctrl + Enter` en la consola | Ejecuta igual que el botón | [ ] |
| Servidor apagado (solo con backend real) | Cualquier instrucción | Mensaje "No se pudo conectar con el servidor" | [ ] |
