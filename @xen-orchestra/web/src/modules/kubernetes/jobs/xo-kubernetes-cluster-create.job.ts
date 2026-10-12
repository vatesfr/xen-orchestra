import { payloadArg } from '@/modules/kubernetes/jobs/xo-kubernetes-cluster-create-args.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export type KubernetesClusterCreatePayload = {
  name: string
  description?: string
  tags?: Record<string, string> | null
  control_plane_replicas: number
  worker_replicas: number
  control_plane_ip: string
  vm_name_prefix: string
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
