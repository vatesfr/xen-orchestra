<template>
  <ul class="infra-vm-list">
    <template v-if="isLoading">
      <InfraLoadingItem v-for="i in 3" :icon="faDisplay" :key="i" />
    </template>
    <p class="text-error" v-else-if="hasError">{{ $t("error-no-data") }}</p>
    <InfraVmItem
      v-else
      v-for="vmOpaqueRef in vmOpaqueRefs"
      :key="vmOpaqueRef"
      :vm-opaque-ref="vmOpaqueRef"
    />
  </ul>
</template>

<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { computed } from "vue";
import { faDisplay } from "@fortawesome/free-solid-svg-icons";
import InfraLoadingItem from "@/components/infra/InfraLoadingItem.vue";
import InfraVmItem from "@/components/infra/InfraVmItem.vue";
import { useVmStore } from "@/stores/vm.store";

const props = defineProps<{
  hostOpaqueRef?: string;
}>();

const vmStore = useVmStore();
const { hasError, isLoading, opaqueRefsByHostRef } = storeToRefs(vmStore);
const vmOpaqueRefs = computed(() =>
  opaqueRefsByHostRef.value.get(props.hostOpaqueRef ?? "OpaqueRef:NULL")
);
</script>

<style scoped lang="postcss">
.text-error {
  padding-left: 3rem;
  font-weight: 700;
  font-size: 16px;
  line-height: 150%;
  color: var(--color-red-vates-base);
}
</style>
