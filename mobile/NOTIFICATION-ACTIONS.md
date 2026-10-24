# Acciones de notificaciones en Android

Los botones de hábitos comparten un procesador entre el listener de la interfaz y una tarea de `expo-task-manager` 58.0.12. La tarea se define síncronamente desde `index.ts`, antes de Expo Router, y se registra una sola vez con `Notifications.registerTaskAsync`. Android Expo Go y las APK que todavía no incluyen el módulo nativo quedan protegidos.

Completar usa el `upsert` existente con la fecha del aviso. Guarda antes de retirar la notificación y conserva los recordatorios futuros. Posponer programa un aviso para 30 minutos después de recibir la interacción; su identificador depende del aviso original y se comprueba tanto en solicitudes programadas como presentadas. Ninguna acción solicita permisos ni navega. Solo el toque normal, reconocido mediante `DEFAULT_ACTION_IDENTIFIER`, carga el router.

Las entregas coincidentes comparten su operación y las acciones se serializan dentro de cada ejecución de JavaScript. Un error permite reintentar y no limpia la respuesta pendiente. El `upsert` y los identificadores nativos estables permiten repetir operaciones entre ejecuciones sin alternar la finalización ni crear varios avisos pospuestos. Al recuperar el primer plano se releen hábitos y el historial usado por Calendario.

Se vuelve a registrar la categoría con `opensAppToForeground: false` para ambos botones. Los avisos antiguos se renuevan usando sus identificadores y fechas originales. Los avisos antiguos ya presentados se retiran, excepto el que tenga una respuesta pendiente. La reconciliación diaria repone las fechas que faltan sin cancelar avisos pospuestos.

## Archivos

- `package.json`, `package-lock.json`, `index.ts`: única dependencia directa nueva, `expo-task-manager`, y entrada propia.
- `src/features/notifications/tasks/notification-action-task.ts`: definición y registro de la tarea.
- `src/features/notifications/services/notification-actions.ts`: validación, cola y procesamiento de acciones.
- `src/features/notifications/services/notification-service.ts`: integración nativa, categorías, renovación y deduplicación de programación.
- `src/app/_layout.tsx`, `src/features/habits/hooks/use-habits.ts`: arranque, respuesta pendiente y actualización al regresar.
- `src/features/settings/services/notification-settings.ts`: reconciliación sin cancelar avisos pospuestos.
- Pruebas de esos servicios, de la tarea y `use-habits-notification-refresh.test.tsx`; configuración aislada `jest.notifications.config.cjs`.

No hay migraciones, cambios de identidad, permisos nuevos, backend ni notificaciones remotas. Se conservan los cambios de fondos que ya estaban en el workspace.

## Comprobaciones realizadas

Fecha: 24 de octubre de 2026.

| Comprobación | Resultado |
| --- | --- |
| `npm run test -- --config jest.notifications.config.cjs` | 64 pruebas aprobadas en 5 suites. Incluye SQLite real, entregas duplicadas, fallos/reintentos, respuesta inicial, días anteriores, navegación, programación y actualización de hábitos/historial con React Native Testing Library. |
| `npm run test` | Bloqueado antes de ejecutar: `jest-expo` requiere el paquete ausente `@react-native/jest-preset`. No se añadieron dependencias ajenas al plan. |
| `npm run typecheck` | Falla por 1733 diagnósticos del proyecto, principalmente globals de pruebas, además de refs en AppTabs/Notas y tipos de `node:sqlite` en el adaptador existente. Ningún diagnóstico en los archivos TypeScript modificados o añadidos para esta corrección. |
| `npm run lint` con caché en temporal | Bloqueado al cargar el parser: `Cannot read properties of undefined (reading 'Cjs')` con TypeScript 7 / ESLint 10. |
| Exportación Expo para Android | Aprobada con la nueva entrada `index.ts`; salida fuera del repositorio. |
| Autolinking Android | Aprobado; detecta `expo-task-manager` 58.0.12 y `TaskManagerPackage`. |
| `git diff --check` | Aprobado. |
| APK y TCL físico | Pendientes: no hay dispositivo ni `adb` disponible en este entorno. La exportación de JavaScript no equivale a compilar una APK. |

Los comandos npm también avisan que npm 12.2.0 no admite el Node 25.7.0 instalado.

## APK y comprobación en el TCL

**Es necesario recompilar la APK. Recargar Metro no incorpora el módulo nativo.** El perfil `preview` existente genera APK:

```sh
cd mobile
eas build --platform android --profile preview
```

Instalar con la misma firma sobre la aplicación anterior, sin desinstalar ni borrar datos. Abrirla una vez para registrar la tarea y renovar los avisos anteriores.

- [ ] Comprobar que siguen presentes hábitos, tareas, notas, ajustes e historial.
- [ ] Crear recordatorios próximos y repetir cada acción con la app visible, en segundo plano y quitada de recientes.
- [ ] Completar: la pantalla actual no cambia ni aparece la app; el aviso desaparece y, al abrir Hábitos y Calendario, la fecha correcta está completada.
- [ ] Posponer: la app no se abre, desaparece el aviso original y llega un único aviso aproximadamente 30 minutos después. Repetir la acción desde ese nuevo aviso.
- [ ] Tocar el cuerpo: abre Hábitos o Tareas según corresponda, también desde un arranque en frío.
- [ ] Probar un aviso del día anterior después de medianoche: completar modifica ese día y posponer conserva su fecha de referencia.
- [ ] Volver a primer plano después de cambiar de día: el aviso pospuesto sigue programado.
- [ ] Probar hábitos ya completados y eliminados, botones en español/inglés, pantalla bloqueada y persistencia al reabrir sin conexión.
- [ ] Verificar que los avisos futuros siguen llegando y que no se solicita permiso desde un botón en segundo plano.

Quitar de recientes y **Forzar detención** son estados distintos. Android puede impedir la ejecución después de Forzar detención hasta abrir manualmente la app. Las restricciones del fabricante y la terminación del proceso durante una escritura pendiente requieren comprobación física; no se puede garantizar una operación interrumpida por el sistema.

Un aviso pospuesto de una versión antigua usa un intervalo cuyo tiempo restante no está expuesto por Expo. Al renovarlo durante esta actualización, ese intervalo vuelve a empezar una sola vez. Los nuevos avisos pospuestos usan una fecha absoluta calculada desde la interacción.

Referencias: [tareas de notificaciones SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/notifications/#registertaskasynctaskname), [TaskManager SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/task-manager/), [entrada propia de Expo Router](https://docs.expo.dev/router/installation/#custom-entry-point).
