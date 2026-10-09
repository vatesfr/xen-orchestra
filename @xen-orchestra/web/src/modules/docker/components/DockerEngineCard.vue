<template>
  <UiCard class="docker-engine-card">
    <UiTitle>
      {{ t('docker-engine') }}
      <template #action>
        <UiButton variant="tertiary" accent="brand" size="small" left-icon="fa:rotate-left" @click="emit('refresh')">
          {{ t('action:refresh') }}
        </UiButton>
        <UiButton variant="secondary" accent="brand" size="small" left-icon="action:edit" @click="emit('configure')">
          {{ t('action:configure-monitoring') }}
        </UiButton>
      </template>
    </UiTitle>

    <UiAlert v-if="connectionAlert !== undefined" accent="danger">
      {{ connectionAlert.title }}
      <template v-if="connectionAlert.error !== undefined" #description>
        <div class="error-description">
          <span>{{ connectionAlert.error.message }}</span>
          <code class="error-code">{{ connectionAlert.error.code }}</code>
        </div>
      </template>
    </UiAlert>

    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('status')">
        <template #value>
          <VtsStatus
            :status="connectionAlert === undefined && info?.status === 'connected' ? 'connected' : 'disconnected'"
          />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('docker-monitoring-mode')" :value="t('docker-monitoring-ssh')" />
      <VtsTabularKeyValueRow :label="t('docker-ssh-address')" :value="sshAddress" />
      <VtsTabularKeyValueRow :label="t('docker-socket-path')">
        <template #value>
          <VtsCodeSnippet :content="engine.socketPath" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('docker-host-key-fingerprint')">
        <template #value>
          <VtsCodeSnippet :content="engine.hostKeyFingerprint ?? '-'" />
        </template>
      </VtsTabularKeyValueRow>
      <template v-if="info?.status === 'connected'">
        <VtsTabularKeyValueRow :label="t('docker-engine-version')" :value="engineVersion" />
        <VtsTabularKeyValueRow :label="t('operating-system')" :value="info.operatingSystem ?? '-'" />
        <VtsTabularKeyValueRow :label="t('storage-driver')" :value="info.storageDriver ?? '-'" />
        <VtsTabularKeyValueRow :label="t('docker-rootless')">
          <template #value>
            <VtsStatus :status="info.rootless" />
          </template>
        </VtsTabularKeyValueRow>
        <VtsTabularKeyValueRow :label="t('docker-images')" :value="String(info.images ?? '-')" />
      </template>
      <VtsTabularKeyValueRow v-if="info !== undefined" :label="t('last-refresh')">
        <template #value>
          <VtsRelativeTime :date="info.asOf" />
        </template>
      </VtsTabularKeyValueRow>
    </VtsTabularKeyValueList>

    <UiAlert v-if="actionResult !== undefined" :accent="actionResult.accent" close @close="actionResult = undefined">
      {{ actionResult.title }}
      <template v-if="actionResult.description" #description>{{ actionResult.description }}</template>
    </UiAlert>

    <div class="buttons">
      <UiButton
        variant="tertiary"
        accent="brand"
        size="small"
        left-icon="action:connect"
        :busy="isTesting"
        @click="testConnection()"
      >
        {{ t('action:test-connection') }}
      </UiButton>
      <UiButton
        variant="tertiary"
        accent="danger"
        size="small"
        left-icon="action:forget"
        :busy="isDeleting"
        @click="forget()"
      >
        {{ t('action:forget-docker-engine') }}
      </UiButton>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import { useDockerErrorMessage } from '@/modules/docker/composables/use-docker-error-message.composable.ts'
import { useXoDockerConnectionDeleteJob } from '@/modules/docker/jobs/xo-docker-connection-delete.job.ts'
import { useXoDockerEngineTestJob } from '@/modules/docker/jobs/xo-docker-engine-test.job.ts'
import type { FrontXoDockerEngine, FrontXoDockerEngineInfo } from '@/modules/docker/types/docker.type.ts'
import VtsCodeSnippet from '@core/components/code-snippet/VtsCodeSnippet.vue'
import VtsRelativeTime from '@core/components/relative-time/VtsRelativeTime.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useDeleteModal } from '@core/composables/modals/use-delete-modal.ts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { engine, info, hasInfoError } = defineProps<{
  engine: FrontXoDockerEngine
  info: FrontXoDockerEngineInfo | undefined
  hasInfoError?: boolean
}>()

const emit = defineEmits<{
  configure: []
  refresh: []
  deleted: []
}>()

const { t } = useI18n()

const sshAddress = computed(
  () => `${engine.username}@${engine.host ?? engine.resolvedHost ?? t('docker-vm-main-address')}:${engine.port}`
)

const connectionAlert = computed<{ title: string; error?: { code: string; message: string } } | undefined>(() => {
  if (hasInfoError) {
    return { title: t('error-no-data') }
  }

  if (info !== undefined && info.status !== 'connected') {
    return { title: t(`docker-status:${info.status}`), error: info.error }
  }

  // the pooled connection failed after the last /info, e.g. while listing the containers
  if (engine.connectionStatus === 'error') {
    return { title: t('docker-connection-failed'), error: engine.error }
  }

  return undefined
})

const engineVersion = computed(() => {
  if (info?.status !== 'connected') {
    return '-'
  }

  return `${info.engineVersion ?? '-'} (API ${info.apiVersion ?? '-'})`
})

const { run: runTest, isRunning: isTesting } = useXoDockerEngineTestJob(() => engine)

const { getDockerErrorMessage } = useDockerErrorMessage()

// result of the connection test, or failure of the forget action
const actionResult = ref<{ accent: 'success' | 'danger'; title: string; description?: string }>()

async function testConnection() {
  actionResult.value = undefined

  try {
    const result = await runTest()

    actionResult.value = result.ok
      ? {
          accent: 'success',
          title: t('docker-connection-test-succeeded'),
          description: result.engineVersion === undefined ? undefined : `Docker ${result.engineVersion}`,
        }
      : {
          accent: 'danger',
          title: t('docker-connection-failed'),
          description: [result.error?.message, result.diagnostic?.message].filter(Boolean).join(' — '),
        }
  } catch (error) {
    // e.g. 429 SSH_COOLDOWN right after a failed authentication
    actionResult.value = {
      accent: 'danger',
      title: t('docker-connection-failed'),
      description: getDockerErrorMessage(error),
    }
  } finally {
    // the test clears or sets the error of the engine
    emit('refresh')
  }
}

const { run: deleteEngine, isRunning: isDeleting } = useXoDockerConnectionDeleteJob(() => engine)

const { open } = useDeleteModal()

function forget() {
  open({
    events: {
      onConfirm: async () => {
        actionResult.value = undefined

        try {
          await deleteEngine()
          emit('deleted')
        } catch (error) {
          actionResult.value = {
            accent: 'danger',
            title: t('docker-forget-engine-failed'),
            description: getDockerErrorMessage(error),
          }
        }
      },
    },
    props: {
      subject: t('docker-engine'),
      description: t('docker-forget-engine-description'),
      confirmLabel: t('action:forget-docker-engine'),
    },
  })
}
</script>

<style lang="postcss" scoped>
.docker-engine-card {
  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem;
  }

  .error-description {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .error-code {
    word-break: break-all;
  }
}
</style>
