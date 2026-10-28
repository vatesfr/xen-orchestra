import { useV2vRememberedConnections } from '@/modules/v2v/composables/use-v2v-remembered-connections.composable.ts'
import { useV2vConnectionForm } from '@/modules/v2v/form/use-v2v-connection-form.ts'
import { useXoV2vInventoryJob } from '@/modules/v2v/jobs/xo-v2v-inventory.job.ts'
import { useXoV2vStatus } from '@/modules/v2v/remote-resources/use-xo-v2v-status.ts'
import { useV2vConnectionStore } from '@/modules/v2v/stores/v2v-connection.store.ts'
import type {
  V2vRememberedConnection,
  V2vRememberedConnectionKey,
} from '@/modules/v2v/types/v2v-remembered-connection.type.ts'
import {
  getV2vConnectionErrorMessage,
  isV2vInvalidCredentialsError,
} from '@/modules/v2v/utils/v2v-connection-error.util.ts'
import {
  createRememberedConnection,
  findRememberedConnection,
  getRememberedConnectionKey,
} from '@/modules/v2v/utils/v2v-remembered-connection.util.ts'
import { getV2vSourceId } from '@/modules/v2v/utils/v2v-source.util.ts'
import type { V2vWizardStep } from '@/modules/v2v/utils/v2v-wizard-step.util.ts'
import { useDeleteModal } from '@core/composables/modals/use-delete-modal.ts'
import type { XoV2vConnection } from '@vates/types'
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

export function useV2vSourceStep({ onPasswordRequired }: { onPasswordRequired?: () => void } = {}) {
  const { t } = useI18n()

  const router = useRouter()

  const route = useRoute()

  const form = useV2vConnectionForm()

  const { connections, remember, forget, forgetPassword } = useV2vRememberedConnections()

  const connectionStore = useV2vConnectionStore()

  const { v2vPrerequisite, canConnectV2vSource } = useXoV2vStatus()

  const { open: openForgetModal } = useDeleteModal()

  const pendingConnection = ref<XoV2vConnection>()

  const { run: loadInventory, isRunning: isConnecting } = useXoV2vInventoryJob(pendingConnection)

  const connectionError = ref<string>()

  const editedKey = ref<V2vRememberedConnectionKey>()

  async function connect(connection: XoV2vConnection) {
    pendingConnection.value = connection

    try {
      const inventory = await loadInventory()

      connectionStore.setConnection(connection, inventory)

      const key = getRememberedConnectionKey(connection)

      // The edited entry is replaced even when its host, port or username changed
      const previousKey = editedKey.value ?? key

      const rememberedConnection = findRememberedConnection(connections.value, previousKey)

      editedKey.value = undefined

      // An entry already remembered is refreshed even when "remember" is unticked, keeping its password choice
      const shouldRemember = form.formData.remember || rememberedConnection !== undefined

      if (shouldRemember) {
        const details = {
          product: inventory.product,
          version: inventory.version,
          sourceId: getV2vSourceId(connection, inventory.instanceUuid),
          vmCount: inventory.vms.length,
          lastUsedAt: Date.now(),
        }

        const withPassword = form.formData.remember || rememberedConnection?.password !== undefined

        remember(createRememberedConnection(connection, details, { withPassword }))

        const isRenamed = rememberedConnection !== undefined && previousKey !== key

        if (isRenamed) {
          forget(previousKey)
        }
      }

      await router.push({ query: { ...route.query, step: 'destination' satisfies V2vWizardStep } })
    } catch (error) {
      if (isV2vInvalidCredentialsError(error)) {
        form.showCredentialsError()

        return
      }

      connectionError.value = getV2vConnectionErrorMessage(error) ?? t('error')
    }
  }

  async function submit() {
    connectionError.value = undefined

    if (!canConnectV2vSource.value) {
      return
    }

    const isValid = await form.validate()

    if (!isValid) {
      return
    }

    await connect(form.connection.value)
  }

  async function connectRemembered(rememberedConnection: V2vRememberedConnection) {
    editedKey.value = undefined
    form.fill(rememberedConnection)

    if (rememberedConnection.password === undefined) {
      onPasswordRequired?.()

      return
    }

    await submit()
  }

  function editRemembered(rememberedConnection: V2vRememberedConnection) {
    editedKey.value = getRememberedConnectionKey(rememberedConnection)
    form.fill(rememberedConnection)
  }

  async function forgetRemembered(rememberedConnection: V2vRememberedConnection) {
    const { event } = await openForgetModal({
      props: { subject: rememberedConnection.host, confirmLabel: t('action:forget') },
    })

    if (event === 'onConfirm') {
      forget(getRememberedConnectionKey(rememberedConnection))
    }
  }

  function forgetRememberedPassword(rememberedConnection: V2vRememberedConnection) {
    forgetPassword(getRememberedConnectionKey(rememberedConnection))
  }

  function cancel() {
    editedKey.value = undefined
    form.reset()
    connectionError.value = undefined
  }

  return {
    form: reactive(form),
    rememberedConnections: connections,
    prerequisite: v2vPrerequisite,
    canConnect: canConnectV2vSource,
    isConnecting,
    connectionError,
    submit,
    connectRemembered,
    editRemembered,
    forgetRemembered,
    forgetRememberedPassword,
    cancel,
  }
}
