import { newRoleArg } from '@/modules/role/jobs/xo-role-args.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import type { XoAclRole } from '@vates/types'
import { useI18n } from 'vue-i18n'

export const useXoRoleCreateJob = defineJob('role.create', [newRoleArg], () => {
  const { t } = useI18n()

  return {
    run(role) {
      return fetchPost<{ id: XoAclRole['id'] }>('acl-roles', role)
    },

    validate(isRunning, role) {
      if (isRunning) {
        throw new JobRunningError(t('job:create:in-progress'))
      }

      if (role === undefined || role.name.length === 0) {
        throw new JobError(t('job:arg:name-required'))
      }
    },
  }
})
