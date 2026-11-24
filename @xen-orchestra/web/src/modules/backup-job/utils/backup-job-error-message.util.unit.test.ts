import { formatErrorMessage } from '@/modules/backup-job/utils/backup-job-error-message.util.ts'

describe('formatErrorMessage', () => {
  it('has no message without error', () => {
    expect(formatErrorMessage(undefined)).toBeUndefined()
  })

  it('gives a text error as is', () => {
    expect(formatErrorMessage('Name is required.')).toBe('Name is required.')
  })

  it('gives the content of an error with an accent', () => {
    expect(formatErrorMessage({ content: 'Name is required.', accent: 'danger' })).toBe('Name is required.')
  })

  it('gives only the first error of a list', () => {
    expect(formatErrorMessage(['Name is required.', { content: 'Invalid query', accent: 'danger' }])).toBe(
      'Name is required.'
    )
  })

  it('has no message for an empty list', () => {
    expect(formatErrorMessage([])).toBeUndefined()
  })
})
