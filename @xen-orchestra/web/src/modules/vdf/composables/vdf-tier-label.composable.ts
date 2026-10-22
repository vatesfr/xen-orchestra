import { tierName } from '@/modules/vdf/utils/vdf-policy.util.ts'
import { useI18n } from 'vue-i18n'

export function useVdfTierLabel() {
  const { t } = useI18n()

  return (value: number) => {
    const name = tierName(value)

    return name === undefined ? t('firewall:tier:number', { n: value }) : t(`firewall:tier:${name}`)
  }
}
