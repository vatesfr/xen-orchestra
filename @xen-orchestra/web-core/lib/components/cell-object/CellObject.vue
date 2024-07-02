<!-- v1.0 -->
<template>
  <td class="cell-object">
    <div class="data">
      <slot />
      <span ref="id" v-tooltip class="id typo p4-regular-italic ellipsis">
        <slot name="id" />
      </span>
      <UiButton
        v-if="copyId"
        :left-icon="faCopy"
        level="secondary"
        size="extra-small"
        color="info"
        @click="copyToClipboard()"
      >
        {{ $t('core.copy-id') }}
      </UiButton>
    </div>
  </td>
</template>

<script lang="ts" setup>
import UiButton from '@core/components/button/UiButton.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faCopy } from '@fortawesome/free-solid-svg-icons'
import { useClipboard } from '@vueuse/core'
import { ref } from 'vue'

defineProps<{
  copyId?: boolean
}>()

defineSlots<{
  default: () => any
  id: () => any
}>()

const id = ref<HTMLElement | null>(null)

const { copy } = useClipboard()

const copyToClipboard = () => {
  const value = id.value?.innerText
  if (value === undefined) {
    return
  }

  copy(value)
}
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

.ellipsis {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  min-width: 0;
}
</style>
