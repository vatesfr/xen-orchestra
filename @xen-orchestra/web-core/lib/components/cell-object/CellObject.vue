<!-- v1.0 -->
<template>
  <td class="cell-object">
    <div class="data">
      <slot />
      <template v-if="id !== undefined">
        <span v-tooltip class="id typo p4-regular-italic text-ellipsis">
          {{ id }}
        </span>
        <UiButton
          v-if="isSupported && copiableId"
          :left-icon="faCopy"
          level="secondary"
          size="extra-small"
          :color="copied ? 'success' : 'info'"
          @click="copy(id)"
        >
          {{ copied ? $t('core.copied') : $t('core.copy-id') }}
        </UiButton>
      </template>
    </div>
  </td>
</template>

<script lang="ts" setup>
import UiButton from '@core/components/button/UiButton.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faCopy } from '@fortawesome/free-solid-svg-icons'
import { useClipboard } from '@vueuse/core'

defineProps<{
  id?: string
  copiableId?: boolean
}>()

const { isSupported, copy, copied } = useClipboard()
</script>

<style lang="postcss" scoped>
.cell-object {
  padding: 0.8rem;
  border: 0.1rem solid var(--color-grey-500);
}

.data {
  display: flex;
  gap: 1.6rem;
  align-items: center;
}

.id {
  color: var(--color-grey-300);
}
</style>
