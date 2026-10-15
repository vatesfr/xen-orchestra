import { useXoPluginConfiguration } from '@/modules/plugin/composables/use-xo-plugin-configuration.composable.ts'
import type { useXoPluginConfigureJob } from '@/modules/plugin/jobs/xo-plugin-configure.job.ts'
import type { useXoPluginDeleteConfigurationJob } from '@/modules/plugin/jobs/xo-plugin-delete-configuration.job.ts'
import type { JsonSchema } from '@/modules/plugin/json-schema-form/json-schema.util.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import type { useDeleteModal } from '@core/composables/modals/use-delete-modal.ts'
import { type MaybeRefOrGetter, nextTick, ref, toValue } from 'vue'

const { jobs, useConfigureJob, useDeleteConfigurationJob, openModal } = vi.hoisted(() => ({
  jobs: {} as Record<'configure' | 'deleteConfiguration', ReturnType<typeof createJob>>,
  useConfigureJob: vi.fn(),
  useDeleteConfigurationJob: vi.fn(),
  openModal: vi.fn(),
}))

vi.mock(import('@/modules/plugin/jobs/xo-plugin-configure.job.ts'), () => ({
  useXoPluginConfigureJob: useConfigureJob as unknown as typeof useXoPluginConfigureJob,
}))

vi.mock(import('@/modules/plugin/jobs/xo-plugin-delete-configuration.job.ts'), () => ({
  useXoPluginDeleteConfigurationJob: useDeleteConfigurationJob as unknown as typeof useXoPluginDeleteConfigurationJob,
}))

vi.mock(import('@core/composables/modals/use-delete-modal.ts'), () => ({
  useDeleteModal: (() => ({ open: openModal })) as unknown as typeof useDeleteModal,
}))

function createJob() {
  return {
    run: vi.fn().mockResolvedValue(undefined),
    canRun: ref(true),
    isRunning: ref(false),
    errorMessage: ref<string>(),
  }
}

beforeEach(() => {
  jobs.configure = createJob()
  jobs.deleteConfiguration = createJob()
  useConfigureJob.mockReset().mockReturnValue(jobs.configure)
  useDeleteConfigurationJob.mockReset().mockReturnValue(jobs.deleteConfiguration)
  openModal.mockReset()
})

const configurationSchema = {
  type: 'object',
  properties: {
    host: { type: 'string' },
    port: { type: 'integer', default: 25 },
  },
  required: ['host'],
} satisfies JsonSchema

const unconfiguredPlugin = createPlugin({ configurationSchema, configuration: undefined, configured: false })

const configuredPlugin = createPlugin({
  configurationSchema,
  configuration: { host: 'smtp.example.org', port: 587 },
  configured: true,
})

function mountConfiguration(plugin: MaybeRefOrGetter<FrontXoPlugin>) {
  return mountComposable(() => useXoPluginConfiguration(plugin)).wrapper.vm
}

async function confirmDeletion() {
  await openModal.mock.calls[0][0].events.onConfirm()
}

describe('formValue', () => {
  it('is the saved configuration', () => {
    expect(mountConfiguration(configuredPlugin).formValue).toEqual({ host: 'smtp.example.org', port: 587 })
  })

  it('is the defaults of the schema when nothing is saved', () => {
    expect(mountConfiguration(unconfiguredPlugin).formValue).toEqual({ port: 25 })
  })

  it('is the configuration sent when saving', async () => {
    let sentConfiguration: unknown
    // the job reads its arguments when it runs
    jobs.configure.run.mockImplementation(() => {
      sentConfiguration = toValue(useConfigureJob.mock.calls[0][1])
    })
    const configuration = mountConfiguration(configuredPlugin)
    configuration.formValue = { host: 'smtp.example.net', port: 587 }

    await configuration.save()

    expect(sentConfiguration).toEqual({ host: 'smtp.example.net', port: 587 })
  })
})

describe('isDirty', () => {
  it('is false until the configuration is edited', () => {
    expect(mountConfiguration(configuredPlugin).isDirty).toBe(false)
  })

  it('is true once the configuration is edited', () => {
    const configuration = mountConfiguration(configuredPlugin)

    configuration.formValue = { host: 'smtp.example.net' }

    expect(configuration.isDirty).toBe(true)
  })
})

describe('reset', () => {
  it('discards the edits', () => {
    const configuration = mountConfiguration(configuredPlugin)
    configuration.formValue = { host: 'smtp.example.net' }

    configuration.reset()

    expect({ formValue: configuration.formValue, isDirty: configuration.isDirty }).toEqual({
      formValue: { host: 'smtp.example.org', port: 587 },
      isDirty: false,
    })
  })

  it('hides the validation errors', async () => {
    const configuration = mountConfiguration(unconfiguredPlugin)
    await configuration.save()

    configuration.reset()

    expect(configuration.summaryErrors).toEqual([])
  })
})

describe('save', () => {
  it('does not save while a required field is missing, and lists the missing fields', async () => {
    const configuration = mountConfiguration(unconfiguredPlugin)

    await configuration.save()

    expect({
      isSaved: configuration.isSaved,
      runs: jobs.configure.run.mock.calls.length,
      missingPaths: configuration.summaryErrors.map(error => error.path),
    }).toEqual({ isSaved: false, runs: 0, missingPaths: [['host']] })
  })

  it('saves a valid configuration and keeps no edit', async () => {
    const configuration = mountConfiguration(unconfiguredPlugin)
    configuration.formValue = { host: 'smtp.example.org', port: 25 }

    await configuration.save()

    expect({
      isSaved: configuration.isSaved,
      runs: jobs.configure.run.mock.calls.length,
      isDirty: configuration.isDirty,
    }).toEqual({ isSaved: true, runs: 1, isDirty: false })
  })

  it('displays the saved configuration until the plugin update is received', async () => {
    const plugin = ref(unconfiguredPlugin)
    const configuration = mountConfiguration(plugin)
    configuration.formValue = { host: 'smtp.example.org', port: 587 }

    await configuration.save()

    expect({ formValue: configuration.formValue, canSave: configuration.canSave }).toEqual({
      formValue: { host: 'smtp.example.org', port: 587 },
      canSave: false,
    })
  })

  it('displays the configuration of the plugin once its update is received', async () => {
    const plugin = ref(unconfiguredPlugin)
    const configuration = mountConfiguration(plugin)
    configuration.formValue = { host: 'smtp.example.org', port: 587 }
    await configuration.save()

    plugin.value = { ...unconfiguredPlugin, configuration: { host: 'smtp.example.net', port: 25 }, configured: true }
    await nextTick()

    expect(configuration.formValue).toEqual({ host: 'smtp.example.net', port: 25 })
  })

  it('keeps the edits and the error when the configuration is rejected', async () => {
    const error = new Error('invalid configuration')
    jobs.configure.run.mockRejectedValue(error)
    const configuration = mountConfiguration(configuredPlugin)
    configuration.formValue = { host: 'smtp.example.net' }

    await configuration.save()

    expect({ isSaved: configuration.isSaved, error: configuration.error, formValue: configuration.formValue }).toEqual({
      isSaved: false,
      error,
      formValue: { host: 'smtp.example.net' },
    })
  })
})

describe('isSaved', () => {
  it('is cleared by the next edit', async () => {
    const configuration = mountConfiguration(configuredPlugin)
    configuration.formValue = { host: 'smtp.example.net' }
    await configuration.save()

    configuration.formValue = { host: 'smtp.example.com' }

    expect(configuration.isSaved).toBe(false)
  })
})

describe('canSave', () => {
  it('is false for a saved configuration which is not edited', () => {
    expect(mountConfiguration(configuredPlugin).canSave).toBe(false)
  })

  it('is true for an edited configuration', () => {
    const configuration = mountConfiguration(configuredPlugin)

    configuration.formValue = { host: 'smtp.example.net' }

    expect(configuration.canSave).toBe(true)
  })

  it('is true when nothing is saved, to save the defaults', () => {
    expect(mountConfiguration(unconfiguredPlugin).canSave).toBe(true)
  })

  it('is false when the configure job cannot run', () => {
    jobs.configure.canRun.value = false

    expect(mountConfiguration(unconfiguredPlugin).canSave).toBe(false)
  })

  it('is false while the configuration is being deleted', () => {
    jobs.deleteConfiguration.isRunning.value = true

    expect(mountConfiguration(unconfiguredPlugin).canSave).toBe(false)
  })
})

describe('canDeleteConfiguration', () => {
  it('is true when the delete job can run', () => {
    expect(mountConfiguration(configuredPlugin).canDeleteConfiguration).toBe(true)
  })

  it('is false when the delete job cannot run', () => {
    jobs.deleteConfiguration.canRun.value = false

    expect(mountConfiguration(configuredPlugin).canDeleteConfiguration).toBe(false)
  })

  it('is false while the configuration is being saved', () => {
    jobs.configure.isRunning.value = true

    expect(mountConfiguration(configuredPlugin).canDeleteConfiguration).toBe(false)
  })
})

describe('isBusy', () => {
  it('is false when nothing runs', () => {
    expect(mountConfiguration(configuredPlugin).isBusy).toBe(false)
  })

  it('is true while the configuration is being saved', () => {
    jobs.configure.isRunning.value = true

    expect(mountConfiguration(configuredPlugin).isBusy).toBe(true)
  })

  it('is true while the configuration is being deleted', () => {
    jobs.deleteConfiguration.isRunning.value = true

    expect(mountConfiguration(configuredPlugin).isBusy).toBe(true)
  })
})

describe('deleteConfiguration', () => {
  it('deletes the configuration once confirmed, and discards the edits', async () => {
    const configuration = mountConfiguration(configuredPlugin)
    configuration.formValue = { host: 'smtp.example.net' }

    configuration.deleteConfiguration()
    await confirmDeletion()

    expect({ runs: jobs.deleteConfiguration.run.mock.calls.length, isDirty: configuration.isDirty }).toEqual({
      runs: 1,
      isDirty: false,
    })
  })

  it('keeps the edits and the error when the deletion fails', async () => {
    const error = new Error('request failed')
    jobs.deleteConfiguration.run.mockRejectedValue(error)
    const configuration = mountConfiguration(configuredPlugin)
    configuration.formValue = { host: 'smtp.example.net' }

    configuration.deleteConfiguration()
    await confirmDeletion()

    expect({ error: configuration.error, isDirty: configuration.isDirty }).toEqual({ error, isDirty: true })
  })

  it('clears the success of the previous save', async () => {
    const configuration = mountConfiguration(configuredPlugin)
    configuration.formValue = { host: 'smtp.example.net' }
    await configuration.save()

    configuration.deleteConfiguration()
    await confirmDeletion()

    expect(configuration.isSaved).toBe(false)
  })
})
