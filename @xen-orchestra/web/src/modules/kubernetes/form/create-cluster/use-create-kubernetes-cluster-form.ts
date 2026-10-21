import { useKubernetesVersionOptions } from '@/modules/kubernetes/form/create-cluster/use-kubernetes-version-options.ts'
import { kubernetesTagsSyntax } from '@/modules/kubernetes/form/kubernetes-tags-syntax.rule.ts'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import {
  buildKubernetesClusterCreatePayload,
  buildKubernetesClusterEditPayload,
  type CreateKubernetesClusterFormData,
  kubernetesClusterToFormData,
} from '@/modules/kubernetes/utils/kubernetes-cluster-form.util.ts'
import { integer, ipv4OrCidr, maxLength, minValue, required, withMessage } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

export const DESCRIPTION_MAX_LENGTH = 4000

/**
 * When a cluster is provided, the form is in edit mode: it is prefilled with the cluster data
 * and only the replicas fields are editable and validated
 */
export function useCreateKubernetesClusterForm(cluster?: XoKubernetesCluster) {
  const { t } = useI18n()

  const isEditMode = cluster !== undefined

  const formData = reactive<CreateKubernetesClusterFormData>(
    isEditMode
      ? kubernetesClusterToFormData(cluster)
      : {
          name: '',
          description: '',
          tagsRaw: '',
          control_plane_replicas: 1,
          worker_replicas: 1,
          control_plane_ip: '',
          vm_name_prefix: '',
          kubernetes_version: undefined,
        }
  )

  const {
    options: versionOptions,
    defaultOption: defaultVersionOption,
    isLoading: areVersionOptionsLoading,
  } = useKubernetesVersionOptions(cluster)

  watch(
    defaultVersionOption,
    option => {
      if (formData.kubernetes_version === undefined && option !== undefined) {
        formData.kubernetes_version = option.value
      }
    },
    { immediate: true }
  )

  const { useField, useFormSelect, useSelect, validate } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        control_plane_replicas: { required, integer, minValue: minValue(1) },
        worker_replicas: { required, integer, minValue: minValue(1) },
        ...(isEditMode
          ? {}
          : {
              name: { required },
              description: {
                maxLength: withMessage(maxLength(DESCRIPTION_MAX_LENGTH), () =>
                  t('field:exceeds-max-characters', { max: DESCRIPTION_MAX_LENGTH })
                ),
              },
              control_plane_ip: { required, ipv4OrCidr: withMessage(ipv4OrCidr, () => t('ip-address-invalid')) },
              vm_name_prefix: { required },
              kubernetes_version: { required },
              tagsRaw: {
                kubernetesTagsSyntax: withMessage(kubernetesTagsSyntax, () => t('form:error:invalid-tag-syntax')),
              },
            }),
      }),
    },
  })

  const nameInputBindings = useField('name', () => ({
    label: t('cluster-name'),
    required: true,
    disabled: isEditMode,
  }))

  const descriptionInputBindings = useField('description', () => ({
    label: t('description'),
    maxCharacters: DESCRIPTION_MAX_LENGTH,
    // TODO Enable in edit mode once CAPI exposes a route to update the description
    disabled: isEditMode,
  }))

  const tagsInputBindings = useField('tagsRaw', () => ({
    label: t('tags'),
    info: t('tags-syntax-hint'),
    rightIcon: 'fa:tags' as const,
  }))

  const controlPlaneReplicasInputBindings = useField('control_plane_replicas', () => ({
    label: t('control-plane-replicas'),
    required: true,
    suffix: t('replicas'),
    info: t('one-by-default'),
    min: 1,
  }))

  const workerReplicasInputBindings = useField('worker_replicas', () => ({
    label: t('worker-replicas'),
    required: true,
    suffix: t('replicas'),
    info: t('one-by-default'),
    min: 1,
  }))

  const controlPlaneIPInputBindings = useField('control_plane_ip', () => ({
    label: t('control-plane-ip'),
    required: true,
    disabled: isEditMode,
  }))

  const vmNamePrefixInputBindings = useField('vm_name_prefix', () => ({
    label: t('vm-name-prefix'),
    required: true,
    disabled: isEditMode,
  }))

  const { id: versionSelectId } = useFormSelect('kubernetes_version', versionOptions, {
    required: !isEditMode,
    disabled: isEditMode,
    loading: areVersionOptionsLoading,
    searchable: true,
    option: { id: 'value', label: 'label', value: 'value' },
  })

  const versionSelectBindings = useSelect(versionSelectId, () => ({
    label: t('version'),
    info:
      defaultVersionOption.value === undefined
        ? undefined
        : t('value-by-default', { value: defaultVersionOption.value.label }),
  }))

  async function validateAndBuild<TPayload>(
    build: (form: CreateKubernetesClusterFormData) => TPayload
  ): Promise<TPayload | undefined> {
    const isValid = await validate()

    if (!isValid) {
      return undefined
    }

    return build(formData)
  }

  function validateAndBuildPayload() {
    return validateAndBuild(({ kubernetes_version, ...form }) =>
      // Already checked by the validation rules, only narrows the type
      kubernetes_version === undefined
        ? undefined
        : buildKubernetesClusterCreatePayload({ ...form, kubernetes_version })
    )
  }

  function validateAndBuildEditPayload() {
    return validateAndBuild(buildKubernetesClusterEditPayload)
  }

  return {
    nameInputBindings,
    descriptionInputBindings,
    tagsInputBindings,
    controlPlaneReplicasInputBindings,
    workerReplicasInputBindings,
    controlPlaneIPInputBindings,
    vmNamePrefixInputBindings,
    versionSelectBindings,
    validateAndBuildPayload,
    validateAndBuildEditPayload,
  }
}
