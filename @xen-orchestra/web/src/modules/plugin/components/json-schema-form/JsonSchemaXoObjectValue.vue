<template>
  <UiTagsList v-if="objectType === 'tag'">
    <VtsTag v-for="id of ids" :key="id" :value="id" />
  </UiTagsList>
  <div v-else class="json-schema-xo-object-value">
    <UiLink v-for="object of objects" :key="object.id" size="medium" :to="object.to" :icon="object.icon">
      {{ object.label }}
    </UiLink>
  </div>
</template>

<script lang="ts" setup>
import { useXoObjectOptions } from '@/modules/plugin/composables/use-xo-object-options.composable.ts'
import type { XoObjectType } from '@/modules/plugin/utils/json-schema.util.ts'
import type { IconName } from '@core/icons'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { computed } from 'vue'

const { objectType, ids } = defineProps<{
  objectType: XoObjectType
  ids: string[]
}>()

type LinkedObjectType = Exclude<XoObjectType, 'tag'>

const OBJECT_PAGES = {
  host: { routeName: '/host/[id]/dashboard', icon: 'object:host' },
  pool: { routeName: '/pool/[id]/dashboard', icon: 'object:pool' },
  sr: { routeName: '/sr/[id]/general', icon: 'object:sr' },
  vm: { routeName: '/vm/[id]/dashboard', icon: 'object:vm' },
} as const satisfies Record<LinkedObjectType, { routeName: string; icon: IconName }>

const linkedObjectType = computed(() => (objectType === 'tag' ? undefined : objectType))

const { options } = useXoObjectOptions(linkedObjectType)

const objects = computed(() => {
  if (linkedObjectType.value === undefined) {
    return []
  }

  const { routeName, icon } = OBJECT_PAGES[linkedObjectType.value]

  return ids.map(id => ({
    id,
    // an object which is unknown, or not fetched yet, is shown by its ID
    label: options.value.find(option => option.value === id)?.label ?? id,
    to: { name: routeName, params: { id } },
    icon,
  }))
})
</script>

<style lang="postcss" scoped>
.json-schema-xo-object-value {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1.6rem;
}
</style>
