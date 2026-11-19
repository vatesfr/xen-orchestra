import { useNewVmSshKeys } from '@/modules/vm/composables/use-new-vm-ssh-keys.composable.ts'
import type { VmState } from '@/modules/vm/types/new-xo-vm.type.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'
import { createNewVmState } from '@/test/new-vm-fixtures.ts'
import { nextTick, reactive } from 'vue'

const FIRST_KEY = 'ssh-ed25519 AAAAC3first user@host'

const SECOND_KEY = 'ssh-ed25519 AAAAC3second user@host'

function mountSshKeys(overrides: Partial<VmState> = {}) {
  return mountComposableWithI18n(() => {
    const vmState = reactive(createNewVmState(overrides))

    return { vmState, ...useNewVmSshKeys(vmState) }
  })
}

describe('addSshKey', () => {
  it('adds the typed key, trimmed, and empties the field', () => {
    const sshKeys = mountSshKeys({ ssh_key: `  ${FIRST_KEY}  ` })

    sshKeys.addSshKey()

    expect(sshKeys.vmState.sshKeys).toEqual([FIRST_KEY])
    expect(sshKeys.vmState.ssh_key).toBe('')
    expect(sshKeys.isSshKeyError).toBe(false)
  })

  it('refuses an empty key', () => {
    const sshKeys = mountSshKeys({ ssh_key: '   ' })

    sshKeys.addSshKey()

    expect(sshKeys.vmState.sshKeys).toEqual([])
    expect(sshKeys.isSshKeyError).toBe(true)
    expect(sshKeys.sshKeyErrorMessage).toBe(sshKeys.t('public-key-mandatory'))
  })

  it('refuses a key that was already added', () => {
    const sshKeys = mountSshKeys({ sshKeys: [FIRST_KEY], ssh_key: FIRST_KEY })

    sshKeys.addSshKey()

    expect(sshKeys.vmState.sshKeys).toEqual([FIRST_KEY])
    expect(sshKeys.isSshKeyError).toBe(true)
    expect(sshKeys.sshKeyErrorMessage).toBe(sshKeys.t('public-key-already-exists'))
  })

  it('forgets the error as soon as a key is typed', async () => {
    const sshKeys = mountSshKeys()
    sshKeys.addSshKey()

    sshKeys.vmState.ssh_key = FIRST_KEY
    await nextTick()

    expect(sshKeys.isSshKeyError).toBe(false)
  })
})

describe('removeSshKey', () => {
  it('removes the key at that position and keeps the others', () => {
    const sshKeys = mountSshKeys({ sshKeys: [FIRST_KEY, SECOND_KEY] })

    sshKeys.removeSshKey(0)

    expect(sshKeys.vmState.sshKeys).toEqual([SECOND_KEY])
  })
})
