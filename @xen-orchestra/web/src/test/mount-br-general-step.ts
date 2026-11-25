import BackupRepositoryGeneralStep from '@/modules/backup-repository/components/form/steps/BackupRepositoryGeneralStep.vue'
import {
  type BackupRepositoryGeneralFormData,
  type BackupRepositoryGeneralFormOptions,
  useBackupRepositoryGeneralForm,
} from '@/modules/backup-repository/form/use-backup-repository-general-form.ts'
import { mountWithSetup } from '@/test/mount-with-setup.ts'
import { h, reactive } from 'vue'

/** The general form data of a new backup repository, nothing filled in, with `overrides` applied. */
export function createBrGeneralFormData(
  overrides: Partial<BackupRepositoryGeneralFormData> = {}
): BackupRepositoryGeneralFormData {
  return {
    name: '',
    type: undefined,
    backupFormat: undefined,
    proxy: undefined,
    encrypted: false,
    encryptionKey: '',
    ...overrides,
  }
}

/**
 * Mounts `BackupRepositoryGeneralStep` on the general form built from `formData` and the form options
 * (edit, multi-edit…), returning the mount and the form data it edits.
 */
export function mountBrGeneralStep(
  formData: Partial<BackupRepositoryGeneralFormData> = {},
  { hideEncryption = false, ...formOptions }: BackupRepositoryGeneralFormOptions & { hideEncryption?: boolean } = {}
) {
  const data = reactive(createBrGeneralFormData(formData))

  const wrapper = mountWithSetup(
    () => {
      const { bindings } = useBackupRepositoryGeneralForm(data, formOptions)

      return () => h(BackupRepositoryGeneralStep, { bindings, hideEncryption })
    },
    { attachTo: document.body }
  )

  return { wrapper, data }
}
