<template>
  <UiCard>
    <UiCardTitle class="patches-title">
      {{ $t("patches") }}
      <template v-if="areAllLoaded" #right>
        {{ $t("missing", { n: count }) }}
      </template>
    </UiCardTitle>
    <div class="table-container">
      <HostPatches :hosts-loaded-status="loadedStatus" :patches="patches" />
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import HostPatches from "@/components/HostPatchesTable.vue";
import UiCard from "@/components/ui/UiCard.vue";
import UiCardTitle from "@/components/ui/UiCardTitle.vue";
import { useHostPatches } from "@/composables/host-patches.composable";
import { useHostStore } from "@/stores/host.store";
import { computed } from "vue";

const { records: hosts } = useHostStore().subscribe();

const { loadedStatus, count, patches } = useHostPatches(() =>
  hosts.value.map((host) => host.$ref)
);

const areAllLoaded = computed(() => {
  return [...loadedStatus.value.values()].every((isReady) => isReady);
});
</script>

<style lang="postcss" scoped>
.patches-title {
  --card-title-right-color: var(--color-red-vates-base);
}

.table-container {
  max-height: 40rem;
  overflow: scroll;
}
</style>
