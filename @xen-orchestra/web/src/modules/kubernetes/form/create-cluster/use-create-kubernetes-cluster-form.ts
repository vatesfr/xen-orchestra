import { kubernetesTagsSyntax } from '@/modules/kubernetes/form/kubernetes-tags-syntax.rule.ts'
import type { KubernetesClusterCreatePayload } from '@/modules/kubernetes/jobs/xo-kubernetes-cluster-create.job.ts'
import type { KubernetesClusterEditPayload } from '@/modules/kubernetes/jobs/xo-kubernetes-cluster-edit.job.ts'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { getControlPlaneHost } from '@/modules/kubernetes/utils/kubernetes-cluster.util.ts'
import { parseKubernetesTagsString } from '@/modules/kubernetes/utils/kubernetes-tags.util.ts'
import { integer, ipv4OrCidr, maxLength, minValue, required, withMessage } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

export const DESCRIPTION_MAX_LENGTH = 4000

/** Temporary default until the create-cluster form exposes a version field. */
export const KUBERNETES_CLUSTER_CREATE_KUBERNETES_VERSION = '1.37.1'

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
    kubernetes_version: KUBERNETES_CLUSTER_CREATE_KUBERNETES_VERSION,
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

function buildKubernetesClusterEditPayload(form: CreateKubernetesClusterFormData): KubernetesClusterEditPayload {
  return {
    control_plane_replicas: form.control_plane_replicas,
    worker_replicas: form.worker_replicas,
  }
}

function kubernetesClusterToFormData(cluster: XoKubernetesCluster): CreateKubernetesClusterFormData {
  return {
    name: cluster.name,
    description: cluster.description ?? '',
    // Displayed as a tags list in edit mode
    tagsRaw: '',
    control_plane_replicas: cluster.control_plane_status.desired_replicas,
    worker_replicas: cluster.worker_status.desired_replicas,
    control_plane_ip: getControlPlaneHost(cluster.control_plane_endpoint),
    // Not exposed by the cluster object
    vm_name_prefix: '',
  }
}

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
        }
  )

  const { useField, validate } = useValidatedForm(formData, {
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
    return validateAndBuild(buildKubernetesClusterCreatePayload)
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
    validateAndBuildPayload,
    validateAndBuildEditPayload,
  }
}
