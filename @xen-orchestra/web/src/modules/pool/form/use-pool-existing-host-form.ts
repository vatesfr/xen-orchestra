import { type FrontXoHost, useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { required } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { useArrayFilter } from '@vueuse/shared'
import { type MaybeRefOrGetter, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

export type PoolExistingHostFormData = {
  host: FrontXoHost['id'] | undefined
}

export function usePoolExistingHostForm(rawPoolId: MaybeRefOrGetter<FrontXoPool['id']>) {
  const { t } = useI18n()

  const poolId = toComputed(rawPoolId)

  const { hosts, hostsByPool } = useXoHostCollection()

  const formData = reactive<PoolExistingHostFormData>({
    host: undefined,
  })

  const { useFormSelect, useSelect, validate } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        host: { required },
      }),
    },
  })

  const availableHosts = useArrayFilter(
    hosts,
    host => host.$pool !== poolId.value && hostsByPool.value.get(host.$pool)?.length === 1
  )

  const { id: hostSelectId } = useFormSelect('host', availableHosts, {
    searchable: true,
    required: true,
    option: {
      label: 'name_label',
      value: 'id',
    },
  })

  async function validateAndGetHostId(): Promise<FrontXoHost['id'] | undefined> {
    const isValid = await validate()

    return isValid ? formData.host : undefined
  }

  return {
    hostSelectBindings: useSelect(hostSelectId, () => ({ label: t('host') })),
    validateAndGetHostId,
  }
}
