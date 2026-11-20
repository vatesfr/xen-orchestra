import type { InstallMode } from '@/modules/vm/types/new-xo-vm.type.ts'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useI18n } from 'vue-i18n'

type SelectableInstallMode = NonNullable<InstallMode>

const DISK_TEMPLATE_INSTALL_MODES: SelectableInstallMode[] = ['no-config', 'ssh-key', 'cloud-init-config', 'cdrom']

const DISKLESS_TEMPLATE_INSTALL_MODES: SelectableInstallMode[] = ['network', 'cdrom']

export function useNewVmInstallModes(isDiskTemplate: MaybeRefOrGetter<boolean>) {
  const { t } = useI18n()

  const installModeLabels: Record<SelectableInstallMode, string> = {
    'no-config': t('no-config'),
    'ssh-key': t('ssh-key'),
    'cloud-init-config': t('cloud-init-config'),
    network: t('pxe'),
    cdrom: t('iso-dvd'),
  }

  const getInstallModeLabel = (installMode: InstallMode) => installModeLabels[installMode ?? 'no-config']

  const installModeOptions = computed(() =>
    (toValue(isDiskTemplate) ? DISK_TEMPLATE_INSTALL_MODES : DISKLESS_TEMPLATE_INSTALL_MODES).map(installMode => ({
      value: installMode,
      label: installModeLabels[installMode],
    }))
  )

  return {
    installModeOptions,
    getInstallModeLabel,
  }
}
