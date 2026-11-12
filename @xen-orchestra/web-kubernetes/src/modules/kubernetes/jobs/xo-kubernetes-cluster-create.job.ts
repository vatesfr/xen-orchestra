import { payloadArg } from '@/modules/kubernetes/jobs/xo-kubernetes-cluster-create-args.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export type KubernetesClusterCreatePayload = {
  control_plane_ip: string
  control_plane_replicas: number
  created_by_xo_user_id?: string
  description?: string
  kubernetes_version: string
  name: string
  tags?: Record<string, string> | null
  vm_name_prefix: string
  worker_replicas: number
}

export const useXoKubernetesClusterCreateJob = defineJob('kubernetes-cluster.create', [payloadArg], () => {
  const { t } = useI18n()

  return {
    async run(payload: KubernetesClusterCreatePayload): Promise<void> {
      await fetchPost('kubernetes/clusters', payload)
    },

    validate(isRunning, payload?: KubernetesClusterCreatePayload) {
      if (isRunning) {
        throw new JobRunningError(t('job:create:in-progress'))
      }

      if (!payload) {
        throw new JobError(t('job:arg:missing-payload'))
      }

      if (payload.name === '') {
        throw new JobError(t('job:arg:name-required'))
      }

      if (payload.control_plane_ip === '') {
        throw new JobError(t('job:arg:ip-address-required'))
      }

      if (payload.vm_name_prefix === '') {
        throw new JobError(t('job:arg:vm-name-prefix-required'))
      }
    },
  }
})
