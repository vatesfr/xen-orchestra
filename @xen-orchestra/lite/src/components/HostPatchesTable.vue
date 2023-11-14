<template>
  <UiCardSpinner v-if="!areSomeLoaded" />
  <UiTable v-else class="hosts-patches-table" :class="{ desktop: isDesktop }">
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
          color="error"
        />
      </td>
    </tr>
  </UiTable>
</template>

<script lang="ts" setup>
import UiCardSpinner from "@/components/ui/UiCardSpinner.vue";
import UiCounter from "@/components/ui/UiCounter.vue";
import UiSpinner from "@/components/ui/UiSpinner.vue";
import UiTable from "@/components/ui/UiTable.vue";
import type { XenApiPatchWithHostRefs } from "@/composables/host-patches.composable";
import { vTooltip } from "@/directives/tooltip.directive";
import { useUiStore } from "@/stores/ui.store";
import { computed } from "vue";

const props = defineProps<{
  patches: XenApiPatchWithHostRefs[];
  hasMultipleHosts: boolean;
  areAllLoaded: boolean;
  areSomeLoaded: boolean;
}>();

const sortedPatches = computed(() =>
  [...props.patches].sort((patch1, patch2) => {
    if (patch1.changelog == null) {
      return 1;
    } else if (patch2.changelog == null) {
      return -1;
    }

    return patch1.changelog.date - patch2.changelog.date;
  })
);

const { isDesktop } = useUiStore();
</script>

<style lang="postcss" scoped>
.hosts-patches-table.desktop {
  max-width: 45rem;
}

.counter {
  font-size: 1rem;
}
</style>
