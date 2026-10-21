<template>
  <UiTableCell>
    <div class="username">
      <UiUserLogo size="small" />
      <UiLink :to :href size="medium">
        {{ content }}
      </UiLink>
    </div>
  </UiTableCell>
</template>

<script setup lang="ts">
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import UiUserLogo from '@core/components/ui/user-logo/UiUserLogo.vue'
import type { LinkOptions } from '@core/composables/link-component.composable.ts'

defineProps<
  Pick<LinkOptions, 'to' | 'href'> & {
    content: string
  }
>()
</script>

<style scoped lang="postcss">
.username {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}
</style>
