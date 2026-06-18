import type { SrAccessMode, SrScope } from '@core/types/storage-repository.type.ts'
import { useMapper } from '@core/packages/mapper/index.ts'
import { CONNECTION_ACTION, type ConnectionAction } from '@core/types/connection.type.ts'
import { getSrModalInfoVariant } from '@core/utils/sr.utils.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useSrModalMessages(options: {
  action: ConnectionAction
  count: MaybeRefOrGetter<number>
  scope: MaybeRefOrGetter<SrScope>
  accessMode: MaybeRefOrGetter<SrAccessMode>
  hostsCount: MaybeRefOrGetter<number>
}) {
  const { t } = useI18n()

  const count = toComputed(options.count)
  const scope = toComputed(options.scope)
  const accessMode = toComputed(options.accessMode)
  const hostsCount = toComputed(options.hostsCount)

  const title = useMapper(
    () => options.action,
    () => ({
      [CONNECTION_ACTION.CONNECT]: t('sr-connect-title', { n: count.value }),
      [CONNECTION_ACTION.DISCONNECT]: t('sr-disconnect-title', { n: count.value }),
    }),
    CONNECTION_ACTION.CONNECT
  )

  const info = useMapper(
    () => `${options.action}-${getSrModalInfoVariant(scope.value, accessMode.value)}`,
    () => ({
      'connect-host': t('sr-connect-info-host', { n: count.value }),
      'connect-pool-local': t('sr-connect-info-pool-local', { n: count.value }),
      'connect-pool-mixed': t('sr-connect-info-pool-mixed'),
      'connect-pool-shared': t('sr-connect-info-pool-shared', {
        n: count.value,
        hostsCount: hostsCount.value,
      }),
      'disconnect-host': t('sr-disconnect-info-host', { n: count.value }),
      'disconnect-pool-local': t('sr-disconnect-info-pool-local', { n: count.value }),
      'disconnect-pool-mixed': t('sr-disconnect-info-pool-mixed'),
      'disconnect-pool-shared': t('sr-disconnect-info-pool-shared', {
        n: count.value,
        hostsCount: hostsCount.value,
      }),
    }),
    'connect-pool-shared'
  )

  return { title, info }
}
