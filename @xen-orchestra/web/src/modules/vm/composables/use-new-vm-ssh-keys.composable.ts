import type { VmState } from '@/modules/vm/types/new-xo-vm.type.ts'
import { useMapper } from '@core/packages/mapper'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

type SshKeyErrorType = 'empty' | 'duplicate'

export function useNewVmSshKeys(vmState: VmState) {
  const { t } = useI18n()

  const sshKeyErrorType = ref<SshKeyErrorType>()

  const isSshKeyError = computed(() => sshKeyErrorType.value !== undefined)

  const sshKeyErrorMessage = useMapper<SshKeyErrorType, string>(
    () => sshKeyErrorType.value,
    {
      empty: t('public-key-mandatory'),
      duplicate: t('public-key-already-exists'),
    },
    'empty'
  )

  function addSshKey() {
    const sshKey = vmState.ssh_key.trim()

    if (!sshKey) {
      sshKeyErrorType.value = 'empty'
      return
    }

    if (vmState.sshKeys.includes(sshKey)) {
      sshKeyErrorType.value = 'duplicate'
      return
    }

    vmState.sshKeys.push(sshKey)
    vmState.ssh_key = ''
    sshKeyErrorType.value = undefined
  }

  function removeSshKey(index: number) {
    vmState.sshKeys.splice(index, 1)
  }

  watch(
    () => vmState.ssh_key,
    newValue => {
      if (newValue.trim() && isSshKeyError.value) {
        sshKeyErrorType.value = undefined
      }
    }
  )

  return {
    isSshKeyError,
    sshKeyErrorMessage,
    addSshKey,
    removeSshKey,
  }
}
