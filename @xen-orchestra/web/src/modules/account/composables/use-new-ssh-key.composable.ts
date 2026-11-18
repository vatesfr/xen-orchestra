import { useXoSshKeyCreateJob } from '@/modules/account/jobs/xo-ssh-key-create.job.ts'
import type { SshKey } from '@/modules/account/types/ssh-key.type.ts'
import { useXoUserResource } from '@/modules/user/remote-resources/use-xo-user.ts'
import { getXoUserSshKeys } from '@/modules/user/utils/xo-user.util.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { XoUser } from '@vates/types'
import { reactiveComputed } from '@vueuse/core'
import { type MaybeRefOrGetter, ref } from 'vue'

export function useNewSshKey(rawUser: MaybeRefOrGetter<XoUser | undefined>) {
  const user = toComputed(rawUser)

  const { $context } = useXoUserResource({}, () => 'me')

  const payload = ref<SshKey>()

  const { run } = useXoSshKeyCreateJob(user, payload)

  const { open } = useOverlay({
    component: () => import('@/modules/account/components/drawer/NewSshKeyDrawer.vue'),
    events: {
      onConfirm: async (newPayload: SshKey) => {
        payload.value = newPayload

        try {
          await run()

          $context.forceReload()
        } catch (error) {
          console.error('Error when creating SSH key', error)
          return KEEP_OVERLAY_OPEN
        }
      },
      onCancel: true,
    },
  })

  const newSshKeyDrawerProps = reactiveComputed(() => ({
    existingSshKeys: user.value === undefined ? [] : getXoUserSshKeys(user.value),
  }))

  function openNewSshKeyDrawer() {
    return open({ props: newSshKeyDrawerProps })
  }

  return {
    openNewSshKeyDrawer,
  }
}
