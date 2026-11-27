<template>
  <UiCard class="appliance-health-check-card">
    <UiCardTitle>
      {{ t('appliance:health-check') }}
      <UiCounter
        v-if="healthCheckProblemCount > 0"
        :value="healthCheckProblemCount"
        :accent="counterAccent"
        size="small"
        variant="primary"
      />
      <template #info>
        <UiButton
          v-if="healthCheckReport !== undefined"
          :disabled="!isCopySupported"
          :left-icon="copyIcon"
          accent="brand"
          size="small"
          variant="tertiary"
          @click="copyReport()"
        >
          {{ copyLabel }}
        </UiButton>
        <ApplianceHealthCheckButton />
      </template>
    </UiCardTitle>

    <VtsStateHero v-if="hasHealthCheckError" format="card" horizontal size="small" type="error">
      {{ t('appliance:health-check-unavailable') }}
    </VtsStateHero>
    <VtsStateHero v-else-if="!isHealthCheckReady" format="card" size="medium" type="busy" />
    <div v-else-if="healthCheckItems.length === 0" class="empty">
      <span class="typo-body-bold">{{ t('appliance:no-health-check-yet') }}</span>
      <span class="secondary typo-body-regular-small">{{ t('appliance:no-health-check-yet-description') }}</span>
    </div>
    <ul v-else class="items">
      <li v-for="item of healthCheckItems" :key="item.name" class="item">
        <VtsIcon :name="getStatusIcon(item.status)" class="icon" size="medium" />
        <div class="text">
          <span class="typo-body-bold-small">{{ item.name }}</span>
          <span v-if="item.detail !== undefined" class="secondary typo-body-regular-small">{{ item.detail }}</span>
        </div>
      </li>
    </ul>
  </UiCard>
</template>

<script lang="ts" setup>
import ApplianceHealthCheckButton from '@/modules/appliance/components/actions/health-check/ApplianceHealthCheckButton.vue'
import { useXoaHealthCheck } from '@/modules/appliance/remote-resources/use-xoa-health-check.ts'
import type { ApplianceHealthCheckStatus } from '@/modules/appliance/types/appliance-health-check.type.ts'
import type { IconName } from '@core/icons'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import { useCopyToClipboard } from '@core/composables/copy.composable.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const {
  healthCheckReport,
  healthCheckItems,
  healthCheckProblemCount,
  hasHealthCheckFailure,
  isHealthCheckReady,
  hasHealthCheckError,
} = useXoaHealthCheck()

const counterAccent = computed(() => {
  if (hasHealthCheckFailure.value) {
    return 'danger'
  }

  return 'warning'
})

const {
  copy: copyReport,
  copied: isReportCopied,
  isSupported: isCopySupported,
} = useCopyToClipboard(() => {
  if (healthCheckReport.value === undefined) {
    return ''
  }

  return healthCheckReport.value
})

const copyIcon = computed(() => {
  if (isReportCopied.value) {
    return 'fa:check-circle'
  }

  return 'fa:copy'
})

const copyLabel = computed(() => {
  if (isReportCopied.value) {
    return t('copied')
  }

  return t('action:copy-report')
})

function getStatusIcon(status: ApplianceHealthCheckStatus): IconName {
  if (status === 'success') {
    return 'status:success-circle'
  }

  if (status === 'warning') {
    return 'status:warning-circle'
  }

  return 'status:danger-circle'
}
</script>

<style lang="postcss" scoped>
.appliance-health-check-card {
  .secondary {
    color: var(--color-neutral-txt-secondary);
  }

  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.8rem;
    padding-block: 2.4rem;
    text-align: center;
  }

  .items {
    display: flex;
    flex-direction: column;

    .item {
      display: flex;
      align-items: flex-start;
      gap: 1.6rem;
      padding-block: 1.2rem;

      &:not(:last-child) {
        border-bottom: 0.1rem solid var(--color-neutral-border);
      }

      .icon {
        flex-shrink: 0;
      }

      .text {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
      }
    }
  }
}
</style>
