import { PlaceholderRow } from '@/shared/components/placeholder-row';
import { ScreenScaffold } from '@/shared/components/screen-scaffold';

export default function TodosScreen() {
  return (
    <ScreenScaffold
      eyebrow="Fase 1"
      title="Tareas"
      description="Una sección separada para tareas con prioridades, fechas límite y eliminación segura.">
      <PlaceholderRow
        marker="01"
        title="Pendientes"
        detail="Las tareas se podrán ordenar por prioridad, fecha límite y creación."
      />
      <PlaceholderRow
        marker="02"
        title="Completadas"
        detail="Completar y reabrir tareas llegará con el MVP de tareas."
      />
      <PlaceholderRow
        marker="03"
        title="Eliminadas"
        detail="El soft-delete queda reservado para una fase dedicada."
      />
    </ScreenScaffold>
  );
}
