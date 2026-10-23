import { useKubernetesUpgradeVersionOptions } from '@/modules/kubernetes/form/upgrade-cluster/use-kubernetes-upgrade-version-options.ts'
import type { KubernetesClusterUpgradePayload } from '@/modules/kubernetes/jobs/xo-kubernetes-cluster-upgrade.job.ts'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { required } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { computed, type MaybeRefOrGetter, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

type UpgradeKubernetesClusterFormData = {
  version: string | undefined
}

export function useUpgradeKubernetesClusterForm(cluster: MaybeRefOrGetter<XoKubernetesCluster>) {
  const { t } = useI18n()

  const formData = reactive<UpgradeKubernetesClusterFormData>({
    version: undefined,
  })

  const { options: versionOptions, isLoading: areVersionOptionsLoading } = useKubernetesUpgradeVersionOptions(cluster)

  const { useFormSelect, useSelect, validate } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        version: { required },
      }),
    },
  })

  const { id: versionSelectId } = useFormSelect('version', versionOptions, {
    required: true,
    loading: areVersionOptionsLoading,
    searchable: true,
    option: { id: 'value', label: 'label', value: 'value' },
  })

  const hasNoNewerVersion = computed(() => !areVersionOptionsLoading.value && versionOptions.value.length === 0)

  const versionSelectBindings = useSelect(versionSelectId, () => ({
    label: t('version'),
    info: hasNoNewerVersion.value ? t('no-newer-kubernetes-version-available') : undefined,
  }))

  async function validateAndBuildPayload(): Promise<KubernetesClusterUpgradePayload | undefined> {
    const isValid = await validate()

    // The version check only narrows the type, it is already checked by the validation rules
    if (!isValid || formData.version === undefined) {
      return undefined
    }

    return { version: formData.version }
  }

  return { versionSelectBindings, validateAndBuildPayload }
}
