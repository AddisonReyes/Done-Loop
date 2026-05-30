# PLAN.md — Done Loop Mobile-First Refactor

Este documento define el plan de refactorización de **Done Loop** para convertir la app actual en una aplicación **mobile-first** usando **Expo + React Native + TypeScript**.

El objetivo de este archivo es reducir el riesgo de cambios masivos, mantener el trabajo compartimentado y permitir que Codex implemente la migración por fases controladas.

---

## 0. Objetivo general

Done Loop actualmente es una app simple de hábitos y tareas pensada principalmente para web. El objetivo es convertirla en una app móvil preparada para Android y futura publicación en Google Play Store.

La nueva versión debe enfocarse en:

- Hábitos separados de tareas.
- Historial mensual real de hábitos.
- To-do list más completa.
- Notificaciones locales.
- Soft-delete para tareas.
- Configuración de usuario.
- Arquitectura preparada para monetización futura.
- Preparación gradual para Play Store.

La prioridad principal es Android. La web pasa a ser secundaria.

---

## 1. Principios de trabajo

### 1.1. Evitar cambios masivos

No se debe intentar implementar toda la refactorización en un solo cambio.

Cada fase debe ser pequeña, revisable y funcional.

### 1.2. Mantener control del alcance

Antes de implementar cada fase, Codex debe:

1. Explicar qué va a cambiar.
2. Indicar qué archivos tocará.
3. Implementar solo lo correspondiente a esa fase.
4. Evitar modificar partes no relacionadas.

### 1.3. Mobile-first

La nueva app debe diseñarse primero para mobile.

La prioridad es:

1. Android.
2. iOS en el futuro si se decide.
3. Web como plataforma secundaria.

### 1.4. Local-first

La app debe funcionar inicialmente sin backend, sin login y sin cloud sync.

Los datos deben persistirse localmente.

### 1.5. Arquitectura limpia

Evitar:

- Lógica de negocio dentro de pantallas.
- Componentes gigantes.
- Acceso directo a base de datos desde UI.
- Dependencias innecesarias.
- Duplicación de código.

---

## 2. Stack objetivo

Stack recomendado:

- Expo.
- React Native.
- TypeScript.
- Expo Router.
- SQLite local, preferiblemente `expo-sqlite`.
- Expo Notifications.
- React Hook Form, si se necesita para formularios.
- Zod, si se necesita para validaciones.
- date-fns, si se necesita para manejo de fechas.
- EAS Build para builds Android.

No implementar por ahora:

- Backend.
- Login.
- Cloud sync.
- Pagos reales.
- Ads reales.
- Analytics avanzado.

---

## 3. Arquitectura objetivo

Estructura sugerida:

```txt
src/
  app/
    _layout.tsx
    index.tsx
    habits/
      index.tsx
      create.tsx
      [id].tsx
    todos/
      index.tsx
      create.tsx
      [id].tsx
    settings/
      index.tsx

  features/
    habits/
      components/
      hooks/
      services/
      repositories/
      types/
      utils/

    todos/
      components/
      hooks/
      services/
      repositories/
      types/
      utils/

    notifications/
      services/
      types/
      utils/

    monetization/
      ads/
      purchases/
      entitlements/
      types/

    settings/
      components/
      services/
      types/

  shared/
    components/
    hooks/
    utils/
    constants/
    theme/
    types/

  storage/
    database/
    migrations/
    repositories/
```

Esta estructura puede ajustarse si existe una mejor alternativa, pero debe mantenerse modular.

---

## 4. Navegación principal

La app debe usar navegación mobile-first con una barra inferior.

Secciones principales:

1. Hábitos.
2. Tareas.
3. Configuración.

La pantalla inicial puede redirigir a Hábitos o mostrar un dashboard simple en el futuro.

---

## 5. Modelo de datos inicial

### 5.1. Habit

Campos mínimos:

```ts
type Habit = {
  id: string;
  name: string;
  description?: string;
  recurrenceType: "daily" | "weekly" | "monthly" | "custom";
  customIntervalDays?: number;
  reminderTime?: string;
  remindersEnabled: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};
```

### 5.2. HabitCompletion

El historial debe estar separado del hábito base.

```ts
type HabitCompletion = {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};
```

### 5.3. Todo

```ts
type TodoStatus = "pending" | "completed" | "deleted";

type TodoPriority = 1 | 2 | 3;

type Todo = {
  id: string;
  title: string;
  description?: string;
  priority: TodoPriority;
  status: TodoStatus;
  dueAt?: string;
  completedAt?: string;
  deletedAt?: string;
  notificationId?: string;
  createdAt: string;
  updatedAt: string;
};
```

Prioridades:

1. Importante.
2. Relevante.
3. Sin importancia.

### 5.4. UserSettings

```ts
type UserSettings = {
  notificationsEnabled: boolean;
  theme: "system" | "light" | "dark";
  plan: "free" | "no_ads" | "premium";
  privacyPolicyUrl?: string;
  termsUrl?: string;
};
```

---

## 6. Fases de implementación

## Fase 1 — Setup base de Expo

### Objetivo

Crear o preparar la base del proyecto Expo sin implementar todavía toda la lógica de negocio.

### Alcance

- Configurar Expo.
- Configurar TypeScript.
- Configurar Expo Router.
- Crear estructura base de carpetas.
- Crear navegación principal con tabs:
  - Hábitos.
  - Tareas.
  - Configuración.
- Crear tema base.
- Crear pantallas placeholder.

### No hacer en esta fase

- No implementar SQLite todavía.
- No implementar formularios completos.
- No implementar notificaciones.
- No implementar ads.
- No implementar pagos.

### Criterios de aceptación

- La app corre en Expo.
- Existen las tres secciones principales.
- La navegación inferior funciona.
- El proyecto compila sin errores de TypeScript.

### Prompt sugerido para Codex

```md
Implementa únicamente la Fase 1 del PLAN.md.

Configura la base mobile-first con Expo, TypeScript y Expo Router. Crea la estructura de carpetas propuesta y una navegación inferior con las pantallas placeholder de Hábitos, Tareas y Configuración.

No implementes persistencia, notificaciones, monetización ni lógica avanzada todavía.
Antes de cambiar archivos, explícame qué vas a tocar.
```

---

## Fase 2 — Persistencia local

### Objetivo

Crear la base de almacenamiento local para hábitos, historial de hábitos, tareas y configuración.

### Alcance

- Configurar SQLite local.
- Crear capa de database.
- Crear migraciones iniciales.
- Crear modelos/types.
- Crear repositorios base:
  - HabitRepository.
  - HabitCompletionRepository.
  - TodoRepository.
  - SettingsRepository.

### No hacer en esta fase

- No crear UI completa.
- No crear gráficos.
- No crear notificaciones.
- No crear monetización.

### Criterios de aceptación

- Las tablas se crean correctamente.
- Se pueden crear, leer, actualizar y eliminar registros desde repositorios.
- La UI no accede directamente a SQLite.
- El proyecto compila sin errores.

### Prompt sugerido para Codex

```md
Implementa únicamente la Fase 2 del PLAN.md.

Agrega persistencia local con SQLite, migraciones iniciales, tipos y repositorios para hábitos, completados de hábitos, tareas y configuración.

No implementes UI avanzada ni notificaciones todavía.
Antes de cambiar archivos, explícame qué vas a tocar.
```

---

## Fase 3 — Hábitos MVP

### Objetivo

Implementar la primera versión funcional de hábitos.

### Alcance

- Listado de hábitos.
- Crear hábito.
- Editar hábito.
- Desactivar hábito.
- Marcar hábito como completado hoy.
- Desmarcar hábito completado hoy.
- Filtros básicos:
  - Todos.
  - Pendientes de hoy.
  - Completados hoy.
- Historial por día.

### No hacer en esta fase

- No crear gráfico mensual avanzado todavía.
- No implementar notificaciones todavía.
- No implementar monetización.

### Criterios de aceptación

- Se pueden crear hábitos.
- Se pueden editar hábitos.
- Se pueden completar hábitos por fecha.
- El historial se guarda en SQLite.
- Cerrar y abrir la app no borra el progreso.

### Prompt sugerido para Codex

```md
Implementa únicamente la Fase 3 del PLAN.md.

Crea el MVP de hábitos usando los repositorios existentes. Debe permitir listar, crear, editar, desactivar, completar y desmarcar hábitos del día actual.

No implementes todavía gráfico mensual avanzado, notificaciones ni monetización.
Antes de cambiar archivos, explícame qué vas a tocar.
```

---

## Fase 4 — Gráfico mensual e historial de hábitos

### Objetivo

Agregar visualización mensual del progreso de hábitos.

### Alcance

- Selector de mes.
- Flecha para mes anterior.
- Flecha para mes siguiente.
- Texto con mes y año actual.
- Gráfico mensual tipo cuadritos.
- Mostrar días con:
  - Sin actividad.
  - Actividad parcial.
  - Actividad completa.
- Consultar meses anteriores.

### Criterios de aceptación

- El selector de mes funciona.
- El gráfico se adapta a meses de 28, 29, 30 y 31 días.
- El historial de meses anteriores se conserva.
- Cambiar de mes no borra información.

### Prompt sugerido para Codex

```md
Implementa únicamente la Fase 4 del PLAN.md.

Agrega selector de mes y gráfico mensual de hábitos basado en el historial guardado. Debe permitir consultar meses anteriores sin perder datos.

No implementes notificaciones ni monetización todavía.
Antes de cambiar archivos, explícame qué vas a tocar.
```

---

## Fase 5 — To-do List MVP

### Objetivo

Implementar la primera versión funcional de tareas.

### Alcance

- Listar tareas.
- Crear tarea.
- Editar tarea.
- Marcar como completada.
- Reabrir tarea completada.
- Prioridades:
  - Importante.
  - Relevante.
  - Sin importancia.
- Fecha límite opcional.
- Ordenar por:
  - Prioridad.
  - Fecha de vencimiento.
  - Fecha de creación.

### No hacer en esta fase

- No implementar soft-delete todavía.
- No implementar modo calendario todavía.
- No implementar notificaciones todavía.

### Criterios de aceptación

- Se pueden crear tareas.
- Se pueden editar tareas.
- Se pueden completar y reabrir tareas.
- Las prioridades se guardan correctamente.
- Las tareas persisten al cerrar y abrir la app.

### Prompt sugerido para Codex

```md
Implementa únicamente la Fase 5 del PLAN.md.

Crea el MVP de tareas usando los repositorios existentes. Debe permitir listar, crear, editar, completar, reabrir y ordenar tareas por prioridad, fecha límite y fecha de creación.

No implementes soft-delete, calendario, notificaciones ni monetización todavía.
Antes de cambiar archivos, explícame qué vas a tocar.
```

---

## Fase 6 — Soft-delete de tareas

### Objetivo

Cambiar la eliminación de tareas para que sea segura y reversible.

### Alcance

- Eliminar tarea debe cambiar status a `deleted`.
- Guardar `deletedAt`.
- Mostrar sección de tareas eliminadas.
- Restaurar tarea eliminada.
- Eliminar definitivamente manualmente.
- Purgar tareas eliminadas con más de 1 mes.

### Criterios de aceptación

- El delete normal no borra inmediatamente de SQLite.
- Las tareas eliminadas aparecen en la sección de eliminadas.
- Se pueden restaurar.
- Se pueden borrar permanentemente.
- La purga después de 1 mes no afecta tareas activas.

### Prompt sugerido para Codex

```md
Implementa únicamente la Fase 6 del PLAN.md.

Agrega soft-delete para tareas. Eliminar una tarea debe moverla a eliminadas usando status deleted y deletedAt. Agrega restauración, eliminación permanente y purga de tareas eliminadas con más de 1 mes.

No implementes calendario, notificaciones ni monetización todavía.
Antes de cambiar archivos, explícame qué vas a tocar.
```

---

## Fase 7 — Modo calendario de tareas

### Objetivo

Agregar visualización de tareas por fecha.

### Alcance

- Crear modo calendario.
- Mostrar tareas por fecha de vencimiento.
- Mostrar tareas completadas por fecha de completado.
- Identificar tareas vencidas.
- Identificar tareas que vencen hoy.

### Criterios de aceptación

- El usuario puede cambiar entre modo lista y modo calendario.
- El calendario muestra tareas por fecha.
- Se distinguen tareas vencidas, pendientes y completadas.

### Prompt sugerido para Codex

```md
Implementa únicamente la Fase 7 del PLAN.md.

Agrega modo calendario para tareas. Debe permitir alternar entre modo lista y modo calendario, mostrando vencimientos, tareas vencidas y tareas completadas por fecha.

No implementes notificaciones ni monetización todavía.
Antes de cambiar archivos, explícame qué vas a tocar.
```

---

## Fase 8 — Notificaciones locales

### Objetivo

Agregar notificaciones locales para hábitos y tareas.

### Alcance

- Configurar permisos de notificación.
- Crear servicio de notificaciones.
- Programar recordatorios de hábitos.
- Programar recordatorios de tareas próximas a vencer.
- Cancelar notificaciones al completar, eliminar o desactivar.
- Reprogramar al editar.
- Evitar duplicados.

### Criterios de aceptación

- La app pide permisos correctamente.
- Las notificaciones se programan desde servicios, no desde la UI directamente.
- Se cancelan correctamente cuando ya no aplican.
- No se generan duplicados.

### Prompt sugerido para Codex

```md
Implementa únicamente la Fase 8 del PLAN.md.

Agrega un servicio de notificaciones locales usando Expo Notifications. Integra recordatorios para hábitos y tareas con fecha/hora límite. Debe manejar permisos, programación, cancelación y reprogramación.

No implementes ads ni compras todavía.
Antes de cambiar archivos, explícame qué vas a tocar.
```

---

## Fase 9 — Configuración

### Objetivo

Crear pantalla de configuración usable y preparada para producto real.

### Alcance

- Preferencias generales.
- Configuración de notificaciones.
- Información de la app.
- Versión actual.
- Links de política de privacidad.
- Links de términos y condiciones.
- Estado del plan del usuario.
- Placeholders para:
  - Quitar anuncios.
  - Premium.
  - Restaurar compras.
  - Enviar feedback.
  - Reportar errores.

### Criterios de aceptación

- Existe pantalla de configuración clara.
- Las opciones no implementadas están deshabilitadas o marcadas como futuras.
- La pantalla no rompe la navegación.

### Prompt sugerido para Codex

```md
Implementa únicamente la Fase 9 del PLAN.md.

Crea la pantalla de configuración con preferencias generales, notificaciones, información de la app, links de privacidad/términos, estado de plan y placeholders para No Ads, Premium, restaurar compras, feedback y reportar errores.

No implementes pagos reales ni ads reales todavía.
Antes de cambiar archivos, explícame qué vas a tocar.
```

---

## Fase 10 — Arquitectura de monetización futura

### Objetivo

Preparar la app para ads y premium sin implementar pagos reales todavía.

### Alcance

- Crear módulo `features/monetization`.
- Crear servicio mock de ads.
- Crear servicio mock de purchases.
- Crear servicio de entitlements.
- Definir planes:
  - `free`.
  - `no_ads`.
  - `premium`.
- Preparar helpers para:
  - Saber si se deben mostrar ads.
  - Saber si una feature premium está habilitada.

### Criterios de aceptación

- La app puede saber el plan actual del usuario.
- La UI puede ocultar ads si el usuario es No Ads o Premium.
- La UI puede consultar si una feature premium está habilitada.
- No hay integración real de pagos todavía.

### Prompt sugerido para Codex

```md
Implementa únicamente la Fase 10 del PLAN.md.

Crea la arquitectura de monetización futura con servicios mock para ads, purchases y entitlements. Define planes free, no_ads y premium. No integres pagos reales ni AdMob real todavía.

Antes de cambiar archivos, explícame qué vas a tocar.
```

---

## Fase 11 — Preparación para Play Store

### Objetivo

Preparar documentación y configuración base para publicación futura.

### Alcance

- Revisar `app.json` o `app.config.ts`.
- Definir package name sugerido:

```txt
com.addisonreyes.easytodo
```

- Preparar versionado.
- Documentar permisos necesarios.
- Crear checklist de Play Store.
- Documentar próximos pasos de EAS Build.

### Checklist recomendado

```txt
[ ] Nombre final de la app
[ ] Package name definitivo
[ ] Icono 512x512
[ ] Splash screen
[ ] Screenshots para Play Store
[ ] Descripción corta
[ ] Descripción larga
[ ] Política de privacidad publicada en una URL
[ ] Términos y condiciones si se usan compras
[ ] Data Safety completado en Google Play Console
[ ] Clasificación de contenido
[ ] Permisos justificados
[ ] App Bundle generado
[ ] Testing interno
[ ] Testing cerrado si la cuenta lo requiere
[ ] Versión mínima estable sin crashes
[ ] IDs de ads reales solo en producción
[ ] IDs de ads de prueba durante desarrollo
[ ] Productos configurados en Play Console si habrá compras
```

### Criterios de aceptación

- Existe documentación clara para publicación.
- El package name está definido o documentado.
- Los permisos están justificados.
- Hay una guía mínima para generar builds con EAS.

### Prompt sugerido para Codex

```md
Implementa únicamente la Fase 11 del PLAN.md.

Prepara la documentación y configuración base para futura publicación en Google Play Store. Revisa app.json o app.config.ts, documenta package name, versionado, permisos, EAS Build y crea un checklist de publicación.

No implementes ads reales ni pagos reales todavía.
Antes de cambiar archivos, explícame qué vas a tocar.
```

---

## 7. Roadmap recomendado

### Versión 1.0

- Expo mobile-first.
- Hábitos.
- Historial mensual.
- Tareas.
- Soft-delete.
- Notificaciones locales.
- Configuración básica.
- Datos locales.
- Sin login.
- Sin backend.
- Sin pagos reales.
- Sin ads reales.

### Versión 1.1

- Ads no invasivos.
- Preparación real de AdMob.
- Mejoras visuales.
- Mejoras de onboarding.

### Versión 1.2

- No Ads.
- Restaurar compras.
- Integración real con Google Play Billing.

### Versión 2.0

- Premium.
- Estadísticas avanzadas.
- Exportación de datos.
- Personalización visual.
- Backups opcionales.
- Posible cloud sync.

---

## 8. Monetización planteada

### Plan gratis

Incluye:

- Hábitos básicos.
- Tareas básicas.
- Historial limitado si se decide aplicar límite.
- Ads no invasivos en el futuro.

### Plan No Ads

Precio aproximado:

```txt
$1.99 USD o $2 USD
```

Incluye:

- Todo lo del plan gratis.
- Sin anuncios.

### Plan Premium

Precio aproximado:

```txt
$5.99 USD o $6 USD
```

Incluye:

- Todo lo del plan No Ads.
- Historial completo.
- Estadísticas avanzadas.
- Más filtros.
- Personalización visual.
- Exportación de datos.
- Backups futuros.
- Features premium futuras.

---

## 9. Notas importantes para Codex

- No implementar todo de golpe.
- Seguir las fases en orden.
- Antes de cada fase, explicar qué se va a tocar.
- No modificar archivos no relacionados.
- Mantener TypeScript estricto siempre que sea posible.
- Priorizar código simple y mantenible.
- Evitar dependencias si no son necesarias.
- Mantener el diseño actual como inspiración, pero optimizado para mobile.
- No implementar backend, login ni cloud sync en esta etapa.
- No implementar pagos externos.
- No implementar ads agresivos.
- No eliminar permanentemente tareas al hacer delete normal.
- No perder historial mensual de hábitos.
