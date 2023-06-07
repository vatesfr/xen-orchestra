<template>
  <UiCardSpinner v-if="!areSomeLoaded" />
  <UiTable v-else class="hosts-patches-table">
    <tr v-for="patch in sortedPatches" :key="patch.$id">
      <th>{{ patch.name }}</th>
      <td>
        <div class="version">
          {{ patch.version }}
          <template v-if="hasMultipleHosts">
            <UiSpinner v-if="!areAllLoaded" />
            <UiCounter
              v-else
              v-tooltip="{
                placement: 'left',
                content: $t('n-hosts-awaiting-patch', {
                  n: patch.$hostRefs.length,
                }),
              }"
              :value="patch.$hostRefs.length"
              class="counter"
              color="error"
            />
          </template>
        </div>
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
import { computed } from "vue";

const props = defineProps<{
  patches: XenApiPatchWithHostRefs[];
  hasMultipleHosts: boolean;
  areAllLoaded: boolean;
  areSomeLoaded: boolean;
}>();

const sortedPatches = computed(() =>
  [...props.patches].sort(
    (patch1, patch2) => patch1.changelog.date - patch2.changelog.date
  )
);
</script>

<style lang="postcss" scoped>
.version {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  align-items: center;
}

.counter {
  font-size: 1rem;
}
</style>
