import { useCredentialsError } from '@/shared/composables/credentials-error.composable.ts'
import { dangerMessage, invalidCredentialsMessage } from '@/test/form-messages.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import { computed, nextTick, ref } from 'vue'

function mountCredentialsError(fieldError?: InputWrapperMessage) {
  const username = ref('root')

  const { wrapper } = mountComposable(() => {
    const { showCredentialsError, withCredentialsError } = useCredentialsError([username])
    const field = withCredentialsError(computed(() => ({ label: 'Username', error: fieldError })))

    return { field, showCredentialsError }
  })

  return { result: wrapper.vm, username }
}

describe('withCredentialsError', () => {
  it('leaves the field without error until credentials are reported invalid', () => {
    const { result } = mountCredentialsError()

    expect(result.field.error).toBeUndefined()
  })

  it('keeps the field own error over the credentials error', () => {
    const ownError = dangerMessage('Username is required.')
    const { result } = mountCredentialsError(ownError)

    result.showCredentialsError()

    expect(result.field.error).toEqual(ownError)
  })
})

describe('showCredentialsError', () => {
  it('reports invalid credentials on the field, keeping its other properties', () => {
    const { result } = mountCredentialsError()

    result.showCredentialsError()

    expect(result.field).toEqual({ label: 'Username', error: invalidCredentialsMessage() })
  })

  it('is cleared when a credential source changes', async () => {
    const { result, username } = mountCredentialsError()
    result.showCredentialsError()

    username.value = 'admin'
    await nextTick()

    expect(result.field.error).toBeUndefined()
  })
})
