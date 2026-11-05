<template>
  <UiTableCell>
    <div class="user-name">
      <UiUserLogo size="small" />
      <UiLink :href size="medium">
        {{ content }}
      </UiLink>
    </div>
  </UiTableCell>
</template>

<script setup lang="ts">
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import UiUserLogo from '@core/components/ui/user-logo/UiUserLogo.vue'

defineProps<{
  content: string
  href?: string
}>()
</script>

<style scoped lang="postcss">
.user-name {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}
</style>
