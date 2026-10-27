<template>
  <UiTableCell>
    <span v-if="items.length === 0" class="secondary">{{ t('none') }}</span>
    <div v-else-if="items.length > 1 && !isExpanded" class="content">
      {{ items[0] }}
      <UiButton
        v-tooltip="summary"
        accent="brand"
        size="small"
        variant="tertiary"
        class="typo-body-regular-small more"
        :aria-label="t('firewall:members:show', { n: items.length - 1, summary })"
        @click="isExpanded = true"
      >
        {{ `+${items.length - 1}` }}
      </UiButton>
    </div>
    <ul v-else>
      <li v-for="(item, index) of items" :key="index" class="content">
        {{ item }}
        <UiButtonIcon
          v-if="isExpanded && index === 0"
          v-tooltip="t('action:show-less')"
          icon="fa:minus"
          accent="brand"
          size="small"
          :aria-label="t('action:show-less')"
          @click="isExpanded = false"
        />
      </li>
    </ul>
  </UiTableCell>
</template>

<script lang="ts" setup>
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

// A group's members, the first one then "+N" (UX P3-4, P3-12): what the
// count holds (VMs, addresses) on hover and for screen readers, as the
// pool and the global views count a global group differently
defineProps<{
  items: string[]
  // what is counted, in words
  summary: string
}>()

const { t } = useI18n()

const isExpanded = ref(false)
</script>

<style lang="postcss" scoped>
.content {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.more {
  padding-inline: 0.4rem;
}

.secondary {
  color: var(--color-neutral-txt-secondary);
}
</style>
