import type { SshKey } from '@/modules/account/types/ssh-key.type.ts'
import { required, withMessage } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { type MaybeRefOrGetter, reactive, toValue } from 'vue'
import { useI18n } from 'vue-i18n'

export type NewSshKeyFormData = {
  title: string
  key: string
}

export function useNewSshKeyForm(existingSshKeys: MaybeRefOrGetter<SshKey[]>) {
  const { t } = useI18n()

  const formData = reactive<NewSshKeyFormData>({
    title: '',
    key: '',
  })

  const { useField, validate } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        key: {
          required,
          unique: withMessage(
            (value: string) => !toValue(existingSshKeys).some(({ key }) => key === value),
            () => t('ssh-key-already-exists')
          ),
        },
      }),
    },
  })

  async function validateAndBuildPayload(): Promise<SshKey | undefined> {
    const valid = await validate()

    if (!valid) {
      return undefined
    }

    return {
      title: formData.title,
      key: formData.key,
    }
  }

  return {
    validateAndBuildPayload,
    titleInputBindings: useField('title', () => ({ label: t('title') })),
    keyInputBindings: useField('key', () => ({
      label: t('public-key'),
      required: true,
      info: t('ssh-public-key-info'),
    })),
  }
}
