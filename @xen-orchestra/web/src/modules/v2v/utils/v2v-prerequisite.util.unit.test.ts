import { getV2vPrerequisiteState, isV2vPrerequisiteOk } from '@/modules/v2v/utils/v2v-prerequisite.util.ts'
import type { XoV2vStatus } from '@vates/types'

const VECTURA_OK: XoV2vStatus = { vectura: { status: 'success' } }

const VECTURA_ERROR: XoV2vStatus = { vectura: { status: 'error', error: 'vectura is not runnable' } }

describe('getV2vPrerequisiteState', () => {
  it.each([
    {
      label: 'is checking until the status is received',
      status: undefined,
      hasError: false,
      expected: { state: 'checking' },
    },
    {
      label: 'is an error without detail when the status cannot be fetched',
      status: undefined,
      hasError: true,
      expected: { state: 'error', error: undefined },
    },
    {
      label: 'is an error with the reason when vectura reports one',
      status: VECTURA_ERROR,
      hasError: false,
      expected: { state: 'error', error: 'vectura is not runnable' },
    },
    { label: 'is ok when vectura reports a success', status: VECTURA_OK, hasError: false, expected: { state: 'ok' } },
    {
      label: 'keeps a received success when a later refresh fails',
      status: VECTURA_OK,
      hasError: true,
      expected: { state: 'ok' },
    },
    {
      label: 'keeps a received error when a later refresh fails',
      status: VECTURA_ERROR,
      hasError: true,
      expected: { state: 'error', error: 'vectura is not runnable' },
    },
  ])('$label', ({ status, hasError, expected }) => {
    expect(getV2vPrerequisiteState({ status, hasError })).toEqual(expected)
  })
})

describe('isV2vPrerequisiteOk', () => {
  it.each([
    { prerequisite: { state: 'ok' }, expected: true },
    { prerequisite: { state: 'checking' }, expected: false },
    { prerequisite: { state: 'error', error: undefined }, expected: false },
  ] as const)('is $expected while the prerequisite is $prerequisite.state', ({ prerequisite, expected }) => {
    expect(isV2vPrerequisiteOk(prerequisite)).toBe(expected)
  })
})
