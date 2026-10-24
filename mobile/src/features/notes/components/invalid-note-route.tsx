import { router } from 'expo-router';

import { useTranslation } from '@/i18n';
import { EmptyState } from '@/shared/components/empty-state';
import { ScreenScaffold } from '@/shared/components/screen-scaffold';

export function InvalidNoteRoute() {
  const { t } = useTranslation();
  return (
    <ScreenScaffold title={t('notes.title')}>
      <EmptyState message={t('notes.invalidRoute')} actionLabel={t('notes.back')} onAction={() => router.dismissTo('/notes')} />
    </ScreenScaffold>
  );
}
