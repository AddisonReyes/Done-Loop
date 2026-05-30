import { PlaceholderRow } from '@/shared/components/placeholder-row';
import { ScreenScaffold } from '@/shared/components/screen-scaffold';

export default function SettingsScreen() {
  return (
    <ScreenScaffold
      eyebrow="Fase 1"
      title="Ajustes"
      description="Configuración del usuario, estado del plan e información de la app para preparar producto real.">
      <PlaceholderRow
        marker="01"
        title="Preferencias"
        detail="Tema, notificaciones y comportamiento general vivirán aquí."
      />
      <PlaceholderRow
        marker="02"
        title="Plan"
        detail="La arquitectura futura distinguirá Free, No Ads y Premium."
      />
      <PlaceholderRow
        marker="03"
        title="Legal"
        detail="Política de privacidad, términos y versión se agregarán antes de publicar."
      />
    </ScreenScaffold>
  );
}
