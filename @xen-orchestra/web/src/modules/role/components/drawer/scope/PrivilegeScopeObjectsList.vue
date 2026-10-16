<template>
  <ul class="privilege-scope-objects-list">
    <li v-for="object of selectedObjects" :key="object.id">
      <UiLink size="medium" :to="object.to" :icon="object.icon">{{ object.label }}</UiLink>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { usePrivilegeScopeObjects } from '@/modules/role/composables/use-privilege-scope-objects.composable.ts'
import type { PrivilegeScopeObject } from '@/modules/role/types.ts'
import type { SelectablePrivilegeResource } from '@/modules/role/utils/privilege-catalogue.util.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { computed } from 'vue'

const { resource, ids } = defineProps<{
  resource: SelectablePrivilegeResource
  ids: string[]
}>()

const { objects } = usePrivilegeScopeObjects(() => resource)

const objectsById = computed(() => new Map(objects.value.map(object => [object.id, object])))

// An object deleted since it was selected is still part of the selector, so it stays listed by its id.
const selectedObjects = computed<PrivilegeScopeObject[]>(() =>
  ids.map(id => objectsById.value.get(id) ?? { id, label: id })
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
