<template>
  <UiCardSpinner v-if="!areSomeLoaded" />
  <UiTable v-else :class="{ desktop: isDesktop }" class="hosts-patches-table">
    <tr v-for="patch in sortedPatches" :key="patch.$id">
      <th>
        <span v-tooltip="{ placement: 'left', content: patch.version }">
          {{ patch.name }}
        </span>
      </th>
      <td v-if="hasMultipleHosts">
        <UiSpinner v-if="!areAllLoaded" />
        <UiCounter
          v-else
          v-tooltip="{
            placement: 'left',
            content: $t('n-hosts-awaiting-patch', {
              n: patch.$hostRefs.size,
            }),
          }"
          :value="patch.$hostRefs.size"
          class="counter"
          accent="danger"
          variant="primary"
          size="small"
        />
      </td>
    </tr>
  </UiTable>
</template>

<script lang="ts" setup>
import UiCardSpinner from '@/components/ui/UiCardSpinner.vue'
import UiSpinner from '@/components/ui/UiSpinner.vue'
import UiTable from '@/components/ui/UiTable.vue'
import type { XenApiPatchWithHostRefs } from '@/composables/host-patches.composable'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useUiStore } from '@core/stores/ui.store'
import { computed } from 'vue'

const props = defineProps<{
  patches: XenApiPatchWithHostRefs[]
  hasMultipleHosts: boolean
  areAllLoaded: boolean
  areSomeLoaded: boolean
}>()

const sortedPatches = computed(() =>
  [...props.patches].sort((patch1, patch2) => {
    if (patch1.changelog == null) {
      return 1
    } else if (patch2.changelog == null) {
      return -1
    }

    return patch1.changelog.date - patch2.changelog.date
  })
)

const { isDesktop } = useUiStore()
</script>

<style lang="postcss" scoped>
.hosts-patches-table.desktop {
  max-width: 45rem;
}

.counter {
  font-size: 1rem;
}
</style>
