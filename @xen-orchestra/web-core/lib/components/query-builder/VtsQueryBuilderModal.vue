<template>
  <VtsOverlay type="modal" class="vts-query-builder-modal" accent="info" dismissible>
    <template v-if="uiStore.isSmall" #title>{{ t('query-builder') }}</template>
    <template #content>
      <VtsQueryBuilderGroup v-model="rootGroup" root />
    </template>
    <template #buttons>
      <VtsOverlayCancelButton />
      <VtsOverlayConfirmButton>{{ t('action:save') }}</VtsOverlayConfirmButton>
    </template>
  </VtsOverlay>
</template>

<script setup lang="ts">
import VtsOverlay from '@core/components/overlay/VtsOverlay.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsQueryBuilderGroup from '@core/components/query-builder/VtsQueryBuilderGroup.vue'
import { type QueryBuilderGroup } from '@core/packages/query-builder/types'
import { useUiStore } from '@core/stores/ui.store.ts'
import { useI18n } from 'vue-i18n'

const rootGroup = defineModel<QueryBuilderGroup>({ required: true })

const { t } = useI18n()

const uiStore = useUiStore()
</script>

<style lang="postcss" scoped>
.vts-query-builder-modal {
  @media (--small) {
    &:deep(.modal) {
      position: absolute;
      inset: 0;
      border-radius: 0;
      max-width: 100vw;
      max-height: 100vh;

      & > .buttons .line {
        flex-direction: row;
      }
    }
  }

  &:deep(.modal) {
    padding: 0;
    gap: 0;

    & > .main {
      margin: 1.6rem;
    }

    & > .buttons {
      padding: 1.6rem;
      border-top: 0.1rem solid var(--color-neutral-border);
      align-items: flex-end;
    }
  }
}
</style>
