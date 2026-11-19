import { t } from '@/test/i18n.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'

type FieldMessage = Extract<InputWrapperMessage, { content: string }>

export function dangerMessage(content: string): FieldMessage {
  return { content, accent: 'danger' }
}

export function invalidCredentialsMessage(): FieldMessage {
  return dangerMessage(t('invalid-username-or-password'))
}

export function requiredMessage(): FieldMessage {
  return dangerMessage(t('form:error:required'))
}
