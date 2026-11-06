import type { XenApiVif } from '@/libs/xen-api/xen-api.types.ts'
import { useVifForm } from '@/modules/vif/form/use-vif-form-base.ts'
import { getVifRateLimit } from '@/modules/vif/utils/vif-rate-limit.util.ts'
import { isTxChecksummingEnabled } from '@/modules/vif/utils/vif-tx-checksumming.util.ts'
import { useI18n } from 'vue-i18n'

export function useEditVifForm(vif: XenApiVif) {
  const { t } = useI18n()

  return useVifForm(
    {
      network: vif.network,
      mac: vif.MAC,
      rateLimit: getVifRateLimit(vif),
      allowedIps: [...vif.ipv4_allowed, ...vif.ipv6_allowed].join('; '),
      txChecksumming: isTxChecksummingEnabled(vif),
    },
    { isMacRequired: true, macInfo: t('mac-address-change-cut-connection') }
  )
}
