<!-- WIP -->
<template>
  <td class="vts-cell-object">
    <div class="data">
      <slot />
      <template v-if="id !== undefined">
        <span v-tooltip class="id typo-form-info text-ellipsis">
          {{ id }}
        </span>
        <UiButton
          v-if="isSupported && copiableId"
          :left-icon="faCopy"
          variant="secondary"
          size="small"
          accent="brand"
          @click="copy(id)"
        >
          {{ copied ? t('core.copied') : t('core.copy-id') }}
        </UiButton>
      </template>
    </div>
  </td>
</template>

<script lang="ts" setup>
import UiButton from '@core/components/ui/button/UiButton.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faCopy } from '@fortawesome/free-solid-svg-icons'
import { useClipboard } from '@vueuse/core'
import { useI18n } from 'vue-i18n'

defineProps<{
  id?: string
  copiableId?: boolean
}>()

const { t } = useI18n()

const { isSupported, copy, copied } = useClipboard()
</script>

<style lang="postcss" scoped>
.vts-cell-object {
  padding: 0.8rem;
  border: 0.1rem solid var(--color-neutral-border);

  .data {
    display: flex;
    gap: 1.6rem;
    align-items: center;
  }

  .id {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
