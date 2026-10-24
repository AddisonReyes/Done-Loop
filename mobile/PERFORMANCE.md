# Rendimiento y consumo de batería

Implementación del 24 de octubre de 2026, común a las marcas y capacidades de los dispositivos. No incorpora ajustes por fabricante, dependencias de producción, migraciones, analítica ni servicios permanentes.

## Cambios

- Las lecturas coincidentes de Hábitos/Calendario y Ajustes comparten una operación. Solo se comparten promesas activas: no se conserva una caché de resultados de SQLite. Las operaciones rechazadas se liberan y una invalidación evita que una lectura nueva reutilice una operación anterior a un cambio.
- Hábitos, Tareas y Notas agrupan eventos en una microtarea. Las pantallas ocultas o en segundo plano esperan a recuperar el foco/primer plano. Si llega un cambio durante una lectura, se procesa después de terminarla. Se conserva la actualización tras acciones de notificaciones.
- Ajustes serializa escrituras y no escribe ni notifica suscriptores si los valores no cambian. Cambiar entre rutas internas de Notas no vuelve a guardar la misma pestaña.
- Los eventos `notesChanged` admiten `id`. La lista relee los identificadores afectados, conserva el orden y elimina elementos ausentes. Los eventos generales, los lotes de más de ocho IDs y los fallos recuperan la lista completa. Fijar una nota utiliza el resultado guardado; si había una lectura anterior en curso, una recarga evita que esta revierta visualmente el cambio.
- La búsqueda conserva Unicode NFC, minúsculas, saltos de línea y coincidencias literales. Prepara cada campo cuando se necesita y lo reutiliza mientras no cambie. La caché usa claves débiles y no conserva texto normalizado de notas de más de 4096 caracteres; esas notas mantienen la búsqueda con cortocircuito.
- El calendario reutiliza recurrencias para un mismo snapshot de hábitos, retiene como máximo 62 fechas por selector e indexa las finalizaciones por fecha. Un nuevo snapshot genera un selector nuevo.
- Los fondos estáticos no se reconstruyen por cambios ajenos del padre y solo se calculan las geometrías del fondo seleccionado. Se conservan todas las capas, colores, transparencias y ejes de la cuadrícula.
- Las animaciones decorativas respetan foco, primer plano y preferencias. Se comparte un único listener nativo de actividad entre sus consumidores y se cancelan animaciones de valores compartidos. El temporizador de medianoche se retira en segundo plano y se rearma al regresar.
- Las configuraciones de canal/categoría de notificaciones se reutilizan durante la ejecución; se agrupan comprobaciones coincidentes de permisos y avisos programados. Los fallos permiten reintentar. Se mantienen las fechas, la precisión solicitada, los botones sin navegación y la renovación de avisos antiguos.

No se cambiaron el debounce de 500 ms, las transacciones de Notas, las protecciones de navegación ni los horarios de los recordatorios. Se conserva `FlatList` con filas de altura variable. No se redujo su ventana de renderizado ni se sustituyeron efectos visuales por aproximaciones sin una medición física que lo justifique.

## Archivos e interfaces

- Coordinación: `shared/services/shared-reads.ts`, `shared/hooks/use-domain-refresh.ts`, `features/habits/services/habit-reads.ts` y sus pruebas.
- Actividad y presentación: hooks `use-app-active`/`use-decorative-animations`, scaffold virtualizado, fondos, tema, listas, botones, controles, modales y animación inicial.
- Datos: hooks de Hábitos/Tareas/Notas, selector de recurrencias, búsqueda, eventos, repositorio de Ajustes y servicio de notificaciones. Las pantallas pasan su foco a los hooks/scaffold mediante una opción opcional; los repositorios conservan sus interfaces públicas.
- Validación: `scripts/benchmark-performance.cjs`, script `npm run benchmark`, pruebas de concurrencia/recuperación y los reportes `performance/baseline.json`/`performance/optimized.json`.

Las herramientas de desarrollo se alinearon con las API utilizadas: TypeScript 6.0, ESLint 9, Testing Library 13, preset de React Native 0.88 y tipos de Node 24 explícitos. Se adaptaron las pruebas de navegación al `renderRouter` asíncrono y los mocks de animaciones. Se corrigieron referencias de componentes para los tipos actuales, sin descartar la referencia del botón de pestaña ni debilitar las reglas.

## Resultados reproducibles

Los JSON adjuntos se generaron en Windows con Node 25.7.0. Son mediciones de CPU/SQLite en el host, no de un teléfono. Se usan medianas de 15 muestras, los mismos fixtures y los mismos resultados de búsqueda/recurrencia. La referencia anterior es el commit `7cf229406330f1b7ed58d14702386aac4a40a2b6`; el modo baseline carga las versiones de tres módulos desde ese commit sin modificar el workspace.

| Escenario | Anterior | Optimizado |
| --- | ---: | ---: |
| Escrituras para 100 actualizaciones idénticas de Ajustes | 100 | 0 |
| Cinco búsquedas, 50 notas | 0.168 ms | 0.070 ms |
| Cinco búsquedas, 2000 notas | 6.487 ms | 1.922 ms |
| Dos pasadas de calendario con selector nuevo, 50 hábitos | 8.515 ms | 3.772 ms |
| Dos pasadas de calendario con selector nuevo, 2000 hábitos | 394.473 ms | 159.197 ms |
| Dos pasadas sobre fechas ya calculadas, 2000 hábitos | 334.084 ms | 0.002 ms |

El último escenario mide reutilización de resultados, no tiempo de renderizado del calendario. Los tiempos fluctúan según el host; los checksums de ambos reportes coinciden.

Las pruebas verifican además tres lecturas compartidas para dos consumidores simultáneos de hábitos/historial, un solo registro de canal/categoría para veinte solicitudes concurrentes, ninguna reconstrucción adicional del gradiente en veinte renders idénticos y cero temporizadores de fecha en segundo plano.

**Coste de memoria:** con 2000 elementos, la diferencia de heap retenido del benchmark es aproximadamente 3 MiB mayor al conservar resultados derivados. Hay ruido de GC/JIT —las diferencias negativas en fixtures pequeños no representan ahorro garantizado—. Las claves débiles, el límite por nota y la expulsión de fechas limitan la retención, pero falta comprobar el presupuesto de memoria en equipos de gama baja. No se afirma una reducción global de RAM o batería.

Reproducir desde `mobile/`, sin ejecutar simultáneamente pruebas/exportaciones:

```sh
npm run benchmark -- --baseline-ref=7cf229406330f1b7ed58d14702386aac4a40a2b6 performance/baseline.json
npm run benchmark -- performance/optimized.json
npm run typecheck
npm run lint
npm run test
```

Resultados de validación: typecheck aprobado; lint aprobado con cuatro avisos existentes de `require()` en el arranque de notificaciones; **369 pruebas aprobadas en 60 suites**; exportación Expo Android aprobada, 1804 módulos. El entorno sigue avisando que npm 12.2.0 no admite Node 25.7.0; usar Node 24 LTS compatible para reproducir CI/builds. No se ejecutaron compilaciones nativas ni pruebas físicas: hay Java, pero no `adb`, emulador ni dispositivo conectado disponible.

## Validación física antes de publicar

Usar APK de release del mismo perfil/firma antes y después, instalada sobre los mismos datos, sin desinstalar. La exportación de JavaScript no sustituye esta prueba. Generar una APK con el perfil existente:

```sh
eas build --platform android --profile preview
```

Cubrir Android de gama baja, media y alta, al menos dos fabricantes y diferentes versiones disponibles de Android. El TCL es una opción dentro de esa matriz. Un emulador permite probar tamaños y recorridos, pero no acredita consumo de batería físico.

1. Registrar modelo, Android, RAM, resolución, escalado, frecuencia de pantalla, brillo, temperatura, conectividad, cantidad de datos y compilación. Mantenerlos iguales en cada comparación. Si existe NXTPAPER u otro modo de pantalla, mantenerlo constante por prueba.
2. Repetir al menos tres veces arranque frío/caliente, veinte cambios de pestaña, desplazamiento de listas, búsquedas y escritura rápida con guardado/salida. Comparar mediana y peor recorrido; comprobar que no aparecen huecos al desplazarse ni se pierde texto.
3. Usar React Native DevTools en una compilación de diagnóstico para contar renders y localizar trabajo JS; medir la respuesta final con release. Usar Android Studio/Perfetto para CPU y actividad en reposo. No incluir el coste de Metro en la comparación final.
4. Obtener `adb shell dumpsys meminfo app.dakotitah.doneloop` antes y después de los recorridos y tras varios ciclos de abrir/cerrar Notas. Verificar una meseta de memoria, sin crecimiento acumulado, y evaluar expresamente el coste de las cachés en gama baja. Obtener `adb shell dumpsys gfxinfo app.dakotitah.doneloop framestats` para comparar frames.
5. Con batería sin cargar y las mismas condiciones, comparar sesiones activas y períodos de pantalla apagada de al menos 30 minutos. Consultar `adb shell dumpsys batterystats app.dakotitah.doneloop`; registrar despertares, tiempo de CPU y notificaciones realmente entregadas. Repetir sin avisos pendientes y con la misma programación. No deducir ahorro de batería de una sola variación de porcentaje.
6. Verificar completar/posponer y tocar avisos con la app visible, en segundo plano y quitada de recientes. Volver a Hábitos y Calendario y comprobar fecha, historial y ausencia de duplicados. **Forzar detención** es un caso distinto; abrir manualmente después antes de evaluar recordatorios.
7. Revisar los cuatro fondos, ambos temas, seis acentos, animaciones desactivadas, texto ampliado, pantallas pequeñas, teclado y estados vacíos/error. Confirmar persistencia sin conexión y actualización sobre una instalación con datos anteriores.

Publicar únicamente después de confirmar que las mejoras no producen regresiones de memoria, interacción, guardado o recordatorios en esa matriz. Ajustar la ventana de listas o la composición gráfica queda condicionado a esas mediciones. Las demás plataformas conservan sus rutas y APIs existentes; no se realizaron pruebas físicas en iOS o web.

Referencias: [medición de rendimiento de React Native](https://reactnative.dev/docs/performance.html), [despertares y batería en Android](https://developer.android.com/topic/performance/vitals/wakeup).
