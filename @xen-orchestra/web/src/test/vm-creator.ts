import { t } from '@/test/i18n.ts'
import { userResourceMock } from '@/test/mock-xo-user.ts'
import type { XoUser } from '@vates/types'

const VM_CREATOR_CASES = [
  {
    name: 'shows the name of the user who created the VM',
    user: { id: 'user-1', name: 'alice', email: 'alice@example.com' } as XoUser,
    createdBy: () => 'alice',
  },
  {
    name: 'falls back to the email of the user who created the VM',
    user: { id: 'user-1', name: '', email: 'alice@example.com' } as XoUser,
    createdBy: () => 'alice@example.com',
    isEmailFallback: true,
  },
  {
    name: 'falls back to "Unknown" when the creator of the VM is not known',
    user: undefined,
    createdBy: () => t('unknown'),
  },
]

/**
 * Registers the tests of the "created by" row of a VM card, the creator read from the mocked user resource
 * (`mock-xo-user.ts`, reset by the test file before each test). `findValues` mounts the card on a VM and reads its rows
 * by their label; `withEmailFallback` adds the case of a creator without a name.
 */
export function itShowsVmCreator(
  findValues: () => Record<string, string>,
  { withEmailFallback = false }: { withEmailFallback?: boolean } = {}
) {
  for (const { name, user, createdBy, isEmailFallback } of VM_CREATOR_CASES) {
    if (isEmailFallback && !withEmailFallback) {
      continue
    }

    it(name, () => {
      userResourceMock.user.value = user

      expect(findValues()).toMatchObject({ [t('created-by')]: createdBy() })
    })
  }
}
