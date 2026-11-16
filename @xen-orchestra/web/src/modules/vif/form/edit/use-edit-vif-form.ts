import { useVifForm } from '@/modules/vif/form/use-vif-form-base.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { useI18n } from 'vue-i18n'

export function useEditVifForm(vif: FrontXoVif) {
  const { t } = useI18n()

  return useVifForm(
    {
      network: vif.$network,
      mac: vif.MAC,
      rateLimit: vif.rateLimit,
      allowedIps: [...vif.allowedIpv4Addresses, ...vif.allowedIpv6Addresses].join('; '),
      txChecksumming: vif.txChecksumming,
    },
    vif.$pool,
    { isMacRequired: true, macInfo: t('mac-address-change-cut-connection') }
  )
}
