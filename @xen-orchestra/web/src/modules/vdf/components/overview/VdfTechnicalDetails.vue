<template>
  <div class="vdf-technical-details">
    <div>
      <UiButton
        variant="tertiary"
        accent="brand"
        size="small"
        :left-icon="isOpen ? 'fa:angle-down' : 'fa:angle-right'"
        :aria-expanded="isOpen"
        :aria-controls="contentId"
        @click="isOpen = !isOpen"
      >
        {{ label ?? t('firewall:technical-details') }}
      </UiButton>
    </div>
    <div v-if="isOpen" :id="contentId" class="content">
      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
import UiButton from '@core/components/ui/button/UiButton.vue'
import { ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'

// Ids, hashes and Open vSwitch internals: there for admins who need them,
// out of the way otherwise.
const { open = false } = defineProps<{
  label?: string
  // open at first
  open?: boolean
}>()

defineSlots<{
  default(): any
}>()

const { t } = useI18n()

const isOpen = ref(open)

const contentId = useId()
</script>

<style lang="postcss" scoped>
.vdf-technical-details {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
  }
}
</style>
