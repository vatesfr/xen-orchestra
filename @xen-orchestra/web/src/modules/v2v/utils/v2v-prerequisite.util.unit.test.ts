import { getV2vPrerequisiteState } from '@/modules/v2v/utils/v2v-prerequisite.util.ts'
import type { XoV2vStatus } from '@vates/types'

const VECTURA_OK: XoV2vStatus = { vectura: { status: 'success' } }

const VECTURA_ERROR: XoV2vStatus = { vectura: { status: 'error', error: 'vectura is not runnable' } }

function getState(status: XoV2vStatus | undefined, hasError = false) {
  return getV2vPrerequisiteState({ status, hasError })
}

describe('getV2vPrerequisiteState', () => {
  it('is checking until the status is received', () => {
    expect(getState(undefined)).toEqual({ state: 'checking' })
  })

  it('is an error without detail when the status cannot be fetched', () => {
    expect(getState(undefined, true)).toEqual({ state: 'error', error: undefined })
  })

  it('is an error with the reason when vectura reports one', () => {
    expect(getState(VECTURA_ERROR)).toEqual({ state: 'error', error: 'vectura is not runnable' })
  })

  it('is ok when vectura reports a success', () => {
    expect(getState(VECTURA_OK)).toEqual({ state: 'ok' })
  })

  it('keeps the received status when a later refresh fails', () => {
    expect(getState(VECTURA_OK, true)).toEqual({ state: 'ok' })
    expect(getState(VECTURA_ERROR, true)).toEqual({ state: 'error', error: 'vectura is not runnable' })
  })
})
