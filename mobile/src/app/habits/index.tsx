import { PlaceholderRow } from '@/shared/components/placeholder-row';
import { ScreenScaffold } from '@/shared/components/screen-scaffold';

export default function HabitsScreen() {
  return (
    <ScreenScaffold
      eyebrow="Fase 1"
      title="Hábitos"
      description="La base mobile-first está lista para recibir el MVP de hábitos en las próximas fases.">
      <PlaceholderRow
        marker="01"
        title="Listado de hábitos"
        detail="Aquí vivirán los hábitos activos, pendientes y completados del día."
      />
      <PlaceholderRow
        marker="02"
        title="Historial mensual"
        detail="El progreso por fecha llegará después de la persistencia local."
      />
      <PlaceholderRow
        marker="03"
        title="Recordatorios"
        detail="Los horarios de hábito se conectarán con notificaciones locales más adelante."
      />
    </ScreenScaffold>
  );
}
