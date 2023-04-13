<template>
  <UiCard>
    <UiCardTitle class="patches-title">
      {{ $t("patches") }}
      <template v-if="areAllLoaded" #right>
        {{ $t("n-missing", { n: count }) }}
      </template>
    </UiCardTitle>
    <div class="table-container">
      <HostPatches
        ref="patchesTable"
        :hosts-loaded-status="loadedStatus"
        :patches="patches"
      />
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import HostPatches from "@/components/HostPatchesTable.vue";
import UiCard from "@/components/ui/UiCard.vue";
import UiCardTitle from "@/components/ui/UiCardTitle.vue";
import { useHostPatches } from "@/composables/host-patches.composable";
import { useHostStore } from "@/stores/host.store";
import { computed, ref } from "vue";

const { records: hosts } = useHostStore().subscribe();

const { loadedStatus, count, patches } = useHostPatches(() =>
  hosts.value.map((host) => host.$ref)
);

const patchesTable = ref<InstanceType<typeof HostPatches>>();

const areAllLoaded = computed(() => patchesTable.value?.areAllLoaded === true);
</script>

<style lang="postcss" scoped>
.patches-title {
  --section-title-right-color: var(--color-red-vates-base);
}

.table-container {
  max-height: 40rem;
  overflow: auto;
}
</style>
