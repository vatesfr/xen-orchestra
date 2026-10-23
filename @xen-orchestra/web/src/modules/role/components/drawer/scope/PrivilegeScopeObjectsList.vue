<template>
  <ul class="privilege-scope-objects-list">
    <li v-for="object of selectedObjects" :key="object.id">
      <UiLink size="medium" :to="object.to" :icon="object.icon">{{ object.label }}</UiLink>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { usePrivilegeScopeObjectsByIds } from '@/modules/role/composables/use-privilege-scope-objects-by-ids.composable.ts'
import type { SelectablePrivilegeResource } from '@/modules/role/utils/privilege-catalogue.util.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'

const { resource, ids } = defineProps<{
  resource: SelectablePrivilegeResource
  ids: string[]
}>()

const selectedObjects = usePrivilegeScopeObjectsByIds(
  () => resource,
  () => ids
)
</script>

<style lang="postcss" scoped>
.privilege-scope-objects-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
