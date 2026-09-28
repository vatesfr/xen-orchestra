import { kubernetesTagsSyntax } from '@/modules/kubernetes/form/kubernetes-tags-syntax.rule.ts'
import type { KubernetesClusterCreatePayload } from '@/modules/kubernetes/jobs/xo-kubernetes-cluster-create.job.ts'
import { parseKubernetesTagsString } from '@/modules/kubernetes/utils/kubernetes-tags.util.ts'
import { integer, ipv4OrCidr, minValue, required, withMessage } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

export type CreateKubernetesClusterFormData = {
  name: string
  description: string
  tagsRaw: string
  controlPlaneReplicas: number
  workerReplicas: number
  controlPlaneIP: string
  vmNamePrefix: string
}

export function buildKubernetesClusterCreatePayload(
  form: CreateKubernetesClusterFormData
): KubernetesClusterCreatePayload {
  const payload: KubernetesClusterCreatePayload = {
    name: form.name,
    controlPlaneReplicas: form.controlPlaneReplicas,
    workerReplicas: form.workerReplicas,
    controlPlaneIP: form.controlPlaneIP,
    vmNamePrefix: form.vmNamePrefix,
  }

  if (form.description !== '') {
    payload.description = form.description
  }

  const tags = parseKubernetesTagsString(form.tagsRaw)

  if (tags !== undefined) {
    payload.tags = tags
  }

  return payload
}

export function useCreateKubernetesClusterForm() {
  const { t } = useI18n()

  const formData = reactive<CreateKubernetesClusterFormData>({
    name: '',
    description: '',
    tagsRaw: '',
    controlPlaneReplicas: 1,
    workerReplicas: 1,
    controlPlaneIP: '',
    vmNamePrefix: '',
  })

  const { useField, validate } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        name: { required },
        controlPlaneReplicas: { required, integer, minValue: minValue(1) },
        workerReplicas: { required, integer, minValue: minValue(1) },
        controlPlaneIP: { required, ipv4OrCidr: withMessage(ipv4OrCidr, () => t('ip-address-invalid')) },
        vmNamePrefix: { required },
        tagsRaw: {
          kubernetesTagsSyntax: withMessage(kubernetesTagsSyntax, () => t('form:error:invalid-tag-syntax')),
        },
      }),
    },
  })

  const nameInputBindings = useField('name', () => ({ label: t('cluster-name'), required: true }))

  const descriptionInputBindings = useField('description', () => ({ label: t('description') }))

  const tagsInputBindings = useField('tagsRaw', () => ({
    label: t('tags'),
    info: t('tags-syntax-hint'),
    rightIcon: 'fa:tags' as const,
  }))

  const controlPlaneReplicasInputBindings = useField('controlPlaneReplicas', () => ({
    label: t('control-plane-replicas'),
    required: true,
    suffix: t('replicas'),
    info: t('one-by-default'),
    min: 1,
  }))

  const workerReplicasInputBindings = useField('workerReplicas', () => ({
    label: t('worker-replicas'),
    required: true,
    suffix: t('replicas'),
    info: t('one-by-default'),
    min: 1,
  }))

  const controlPlaneIPInputBindings = useField('controlPlaneIP', () => ({
    label: t('control-plane-ip'),
    required: true,
  }))

  const vmNamePrefixInputBindings = useField('vmNamePrefix', () => ({
    label: t('vm-name-prefix'),
    required: true,
  }))

  async function validateAndBuildPayload(): Promise<KubernetesClusterCreatePayload | undefined> {
    const isValid = await validate()

    if (!isValid) {
      return undefined
    }

    return buildKubernetesClusterCreatePayload(formData)
  }

  return {
    nameInputBindings,
    descriptionInputBindings,
    tagsInputBindings,
    controlPlaneReplicasInputBindings,
    workerReplicasInputBindings,
    controlPlaneIPInputBindings,
    vmNamePrefixInputBindings,
    validateAndBuildPayload,
  }
}
