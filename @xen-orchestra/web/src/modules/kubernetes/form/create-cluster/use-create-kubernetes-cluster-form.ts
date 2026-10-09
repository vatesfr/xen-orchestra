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
  control_plane_replicas: number
  worker_replicas: number
  control_plane_ip: string
  vm_name_prefix: string
}

export function buildKubernetesClusterCreatePayload(
  form: CreateKubernetesClusterFormData
): KubernetesClusterCreatePayload {
  const payload: KubernetesClusterCreatePayload = {
    name: form.name,
    control_plane_replicas: form.control_plane_replicas,
    worker_replicas: form.worker_replicas,
    control_plane_ip: form.control_plane_ip,
    vm_name_prefix: form.vm_name_prefix,
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
    control_plane_replicas: 1,
    worker_replicas: 1,
    control_plane_ip: '',
    vm_name_prefix: '',
  })

  const { useField, validate } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        name: { required },
        control_plane_replicas: { required, integer, minValue: minValue(1) },
        worker_replicas: { required, integer, minValue: minValue(1) },
        control_plane_ip: { required, ipv4OrCidr: withMessage(ipv4OrCidr, () => t('ip-address-invalid')) },
        vm_name_prefix: { required },
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
  }))

  const vmNamePrefixInputBindings = useField('vm_name_prefix', () => ({
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
