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

    <UiAlert v-if="info !== undefined && info.status !== 'connected'" accent="danger">
      {{ t(`docker-status:${info.status}`) }}
      <template #description>
        <div class="error-description">
          <span>{{ info.error.message }}</span>
          <code class="error-code">{{ info.error.code }}</code>
        </div>
      </template>
    </UiAlert>

    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('status')">
        <template #value>
          <VtsStatus :status="info?.status === 'connected' ? 'connected' : 'disconnected'" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('docker-monitoring-mode')" :value="t('docker-monitoring-ssh')" />
      <VtsTabularKeyValueRow :label="t('docker-ssh-address')" :value="sshAddress" />
      <VtsTabularKeyValueRow :label="t('docker-socket-path')">
        <template #value>
          <code>{{ engine.socketPath }}</code>
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('docker-host-key-fingerprint')">
        <template #value>
          <code class="fingerprint">{{ engine.hostKeyFingerprint ?? '-' }}</code>
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

    <div>
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
import { useXoDockerConnectionDeleteJob } from '@/modules/docker/jobs/xo-docker-connection-delete.job.ts'
import type { FrontXoDockerEngine, FrontXoDockerEngineInfo } from '@/modules/docker/types/docker.type.ts'
import VtsRelativeTime from '@core/components/relative-time/VtsRelativeTime.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useDeleteModal } from '@core/composables/modals/use-delete-modal.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { engine, info } = defineProps<{
  engine: FrontXoDockerEngine
  info: FrontXoDockerEngineInfo | undefined
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

const engineVersion = computed(() => {
  if (info?.status !== 'connected') {
    return '-'
  }

  return `${info.engineVersion ?? '-'} (API ${info.apiVersion ?? '-'})`
})

const { run: deleteEngine, isRunning: isDeleting } = useXoDockerConnectionDeleteJob(() => engine)

const { open } = useDeleteModal()

function forget() {
  open({
    events: {
      onConfirm: async () => {
        try {
          await deleteEngine()
          emit('deleted')
        } catch (error) {
          console.error('Error when forgetting the Docker engine:', error)
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
  .error-description {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .error-code,
  .fingerprint {
    font-family: monospace;
    word-break: break-all;
  }
}
</style>
