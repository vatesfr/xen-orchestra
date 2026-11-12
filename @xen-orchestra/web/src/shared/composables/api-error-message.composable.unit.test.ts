import { useApiErrorMessage } from '@/shared/composables/api-error-message.composable.ts'
import { createApiError } from '@/test/create-api-error.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'

function mountApiErrorMessage() {
  return mountComposableWithI18n(() => useApiErrorMessage())
}

describe('getErrorMessage', () => {
  it('tells the message the server explains the failure with', () => {
    expect(mountApiErrorMessage().getErrorMessage(createApiError(500, { error: 'unreachable' }))).toBe('unreachable')
  })

  it('tells a generic error when the failure carries no message', () => {
    const result = mountApiErrorMessage()

    expect(result.getErrorMessage(new Error(''))).toBe(result.t('error'))
  })
})
