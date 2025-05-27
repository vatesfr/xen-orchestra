<template>
  <UiPanel>
    <template #header>
      <UiButton
        v-tooltip="$t('coming-soon')"
        disabled
        variant="tertiary"
        size="medium"
        accent="brand"
        :left-icon="faEdit"
      >
        {{ $t('change-status') }}
      </UiButton>
      <UiButton
        v-tooltip="$t('coming-soon')"
        disabled
        variant="tertiary"
        size="medium"
        accent="danger"
        :left-icon="faTrash"
      >
        {{ $t('forget') }}
      </UiButton>
      <UiButtonIcon v-tooltip="$t('coming-soon')" disabled accent="brand" size="medium" :icon="faEllipsis" />
    </template>
    <template #default>
      <UiCard class="card-container">
        <UiCardTitle class="typo-body-bold text-ellipsis">
          {{ $t('general-information') }}
        </UiCardTitle>
        <div class="content">
          <!-- Pool -->
          <VtsCardRowKeyValue>
            <template #key>{{ $t('pool') }}</template>
            <template #value>{{ server.poolNameLabel }}</template>
          </VtsCardRowKeyValue>
          <!-- ID -->
          <VtsCardRowKeyValue>
            <template #key>{{ $t('id') }}</template>
            <template #value>{{ server.id }}</template>
            <template #addons>
              <VtsCopyButton :value="server.host" />
            </template>
          </VtsCardRowKeyValue>
          <!-- Description -->
          <VtsCardRowKeyValue>
            <template #key>{{ $t('description') }}</template>
            <template #value>{{ server.poolNameDescription }}</template>
            <template #addons>
              <VtsCopyButton :value="server.username" />
            </template>
          </VtsCardRowKeyValue>
          <!-- tag -->
          <VtsCardRowKeyValue>
            <template #key>{{ $t('tags') }}</template>
            <template #value>{{ server. }}</template>
          </VtsCardRowKeyValue>
          <!-- ENABLED -->
          <VtsCardRowKeyValue>
            <template #key>{{ $t('enabled') }}</template>
            <template #value>{{ server.enabled ? $t('yes') : $t('no') }}</template>
          </VtsCardRowKeyValue>
          <!-- READ ONLY -->
          <VtsCardRowKeyValue>
            <template #key>{{ $t('read-only') }}</template>
            <template #value>{{ server.readOnly ? $t('yes') : $t('no') }}</template>
          </VtsCardRowKeyValue>
          <!-- POOL NAME -->
          <VtsCardRowKeyValue v-if="server.poolNameLabel">
            <template #key>{{ $t('pool') }}</template>
            <template #value>{{ server.poolNameLabel }}</template>
            <template #addons>
              <VtsCopyButton :value="server.poolNameLabel" />
            </template>
          </VtsCardRowKeyValue>
          <!-- POOL DESCRIPTION -->
          <VtsCardRowKeyValue v-if="server.poolNameDescription">
            <template #key>{{ $t('description') }}</template>
            <template #value>{{ server.poolNameDescription }}</template>
            <template #addons>
              <VtsCopyButton :value="server.poolNameDescription" />
            </template>
          </VtsCardRowKeyValue>
        </div>
      </UiCard>
    </template>
  </UiPanel>
</template>

<script setup lang="ts">
import type { XoServer } from '@/types/xo/server.type'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faEdit, faEllipsis, faTrash } from '@fortawesome/free-solid-svg-icons'

const { server } = defineProps<{
  server: XoServer
}>()
</script>

<style scoped lang="postcss">
.card-container {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;

    .value:empty::before {
      content: '-';
    }
  }
}
</style>
