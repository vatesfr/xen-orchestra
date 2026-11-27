import { type RegisterAppliancePayload, useXoaRegisterJob } from '@/modules/appliance/jobs/xoa-register.job.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { t } from '@/test/i18n.ts'
import { itCanRun, itCannotRun, itRejectsWithRequestError } from '@/test/job-cases.ts'
import { expectJobRunning } from '@/test/job-running.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mockedExport } from '@/test/spy-on-module.ts'

const post = mockedExport(fetchPost)

beforeEach(() => {
  post.mockResolvedValue(undefined)
})

const payload: RegisterAppliancePayload = {
  email: 'admin@example.org',
  password: 'secret',
}

function mountRegisterJob(registerPayload: RegisterAppliancePayload | undefined) {
  return mountComposable(() => useXoaRegisterJob(registerPayload)).wrapper.vm
}

describe('run', () => {
  it('registers the appliance with the credentials', async () => {
    await mountRegisterJob(payload).run()

    expect(post).toHaveBeenCalledWith('plugins/xoa/registration', payload)
  })

  itRejectsWithRequestError('propagates the error of the request', {
    request: post,
    errorMessage: 'invalid credentials',
    run: () => mountRegisterJob(payload).run(),
  })
})

describe('validate', () => {
  itCanRun([{ name: 'can run with an email and a password', mountJob: () => mountRegisterJob(payload) }])

  itCannotRun([
    {
      name: 'cannot run without payload',
      mountJob: () => mountRegisterJob(undefined),
      errorMessage: t('job:arg:missing-payload'),
    },
    {
      name: 'cannot run without email',
      mountJob: () => mountRegisterJob({ ...payload, email: '' }),
      errorMessage: t('job:arg:email-required'),
    },
    {
      name: 'cannot run without password',
      mountJob: () => mountRegisterJob({ ...payload, password: '' }),
      errorMessage: t('job:arg:password-required'),
    },
  ])

  it('cannot run while the appliance is being registered', () => {
    post.mockReturnValue(new Promise(() => {}))
    const job = mountRegisterJob(payload)

    expectJobRunning(job, t('job:xoa-register:in-progress'))
  })
})
