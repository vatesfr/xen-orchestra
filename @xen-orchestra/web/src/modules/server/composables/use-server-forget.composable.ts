import { useXoServerForgetJob } from '@/modules/server/jobs/xo-server-remove.job.ts'
import type { FrontXoServer } from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'

export function useServerForget(
  rawServerId: MaybeRefOrGetter<FrontXoServer['id']>,
  rawServerLabel: MaybeRefOrGetter<FrontXoServer['label']>
) {
  const serverId = toComputed(rawServerId)

  const serverLabel = toComputed(rawServerLabel)

  const {
    run,
    canRun: canForgetServer,
    isRunning: isForgettingServer,
    errorMessage: forgetServerErrorMessage,
  } = useXoServerForgetJob([serverId])

  const { open } = useOverlay({
    component: () => import('@/modules/server/components/modal/ServerForgetModal.vue'),
    events: {
      onConfirm: async () => {
        try {
          await run()
        } catch (error) {
          console.error('Error when forgetting server:', error)
        }
      },
      onCancel: true,
    },
  })

  function forgetServer() {
    return open({
      props: { serverLabel: serverLabel.value ?? '' },
    })
  }

  return { forgetServer, canForgetServer, isForgettingServer, forgetServerErrorMessage }
}
