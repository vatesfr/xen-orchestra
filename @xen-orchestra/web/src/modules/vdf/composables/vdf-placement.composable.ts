import { ApiError } from '@/shared/error/api.error.ts'
import { useInfoModal } from '@core/composables/modals/use-info-modal.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { useI18n } from 'vue-i18n'

// vdf#141: xo-server refuses to start, resume or migrate a VM the firewall
// protects onto a host whose firewall agent can't enforce (its placement
// guards): 403, this in the error's data (xo-common's placementRefused)
export type VdfPlacementRefusal = {
  operation: 'start' | 'resume' | 'migrate'
  vm: { id: string; name?: string }
  host?: { id: string; name?: string }
  guard: string
  reason: string
  // bypassFirewallCheck overrides it, for the users it allows
  bypass: { parameter: string; allowed: boolean; who: string }
}

// the firewall's refusal an API error carries, if it is one
export function placementRefusalOf(error: unknown): VdfPlacementRefusal | undefined {
  if (!(error instanceof ApiError) || error.status !== 403) {
    return undefined
  }

  const data = error.cause?.data as Partial<VdfPlacementRefusal> | undefined

  return data?.guard === 'firewall' && typeof data.reason === 'string' && typeof data.bypass?.allowed === 'boolean'
    ? (data as VdfPlacementRefusal)
    : undefined
}

/**
 * Starts, resumes or migrates a VM (`place`, with whether to override the
 * firewall's check) and, if the firewall refuses, says why: a user it allows
 * to override it is asked whether to go on anyway, without the firewall
 * (then `place(true)`); the others are told who may. A refusal not
 * overridden is thrown, as `place` threw it.
 */
export function useVdfPlacementOverride() {
  const { t } = useI18n()

  const { open: openConfirm } = useOverlay({
    component: () => import('@/modules/vdf/components/VdfConfirmModal.vue'),
    events: { onConfirm: true, onCancel: true },
  })

  const { open: openInfo } = useInfoModal()

  // one question at a time: a start of several VMs may be refused for each
  let asking: Promise<unknown> = Promise.resolve()

  function ask<T>(question: () => Promise<T>) {
    const answer = asking.then(question)
    asking = answer.catch(() => undefined)

    return answer
  }

  async function placeWithOverride<T>(place: (bypassFirewallCheck: boolean) => Promise<T>): Promise<T> {
    try {
      return await place(false)
    } catch (error) {
      const refusal = placementRefusalOf(error)

      if (refusal === undefined) {
        throw error
      }

      const vm = refusal.vm.name ?? refusal.vm.id

      if (!refusal.bypass.allowed) {
        await ask(() =>
          openInfo({
            props: {
              title: t(`firewall:placement:${refusal.operation}:refused`, { vm }),
              content: refusal.reason,
              tip: t('firewall:placement:who', { who: refusal.bypass.who }),
            },
          })
        )

        throw error
      }

      const response = await ask(() =>
        openConfirm({
          props: {
            accent: 'danger',
            icon: 'fa:shield',
            title: t(`firewall:placement:${refusal.operation}:title`, { vm }),
            message: t('firewall:placement:message', { reason: refusal.reason }),
            confirmLabel: t(`firewall:placement:${refusal.operation}:anyway`),
          },
        })
      )

      if (response.event !== 'onConfirm') {
        throw error
      }

      return place(true)
    }
  }

  return { placeWithOverride }
}
