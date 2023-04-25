<template>
  <ul class="infra-vm-list">
    <li v-if="hasError" class="text-error">{{ $t("error-no-data") }}</li>
    <template v-else-if="!isReady">
      <InfraLoadingItem v-for="i in 3" :key="i" :icon="faDisplay" />
    </template>
    <InfraVmItem v-for="vm in vms" :key="vm.$ref" :vm-opaque-ref="vm.$ref" />
  </ul>
</template>

<script lang="ts" setup>
import InfraLoadingItem from "@/components/infra/InfraLoadingItem.vue";
import InfraVmItem from "@/components/infra/InfraVmItem.vue";
import { useVmStore } from "@/stores/vm.store";
import { faDisplay } from "@fortawesome/free-solid-svg-icons";
import { computed } from "vue";

const props = defineProps<{
  hostOpaqueRef?: string;
}>();

const { isReady, recordsByHostRef, hasError } = useVmStore().subscribe();

const vms = computed(() =>
  recordsByHostRef.value.get(props.hostOpaqueRef ?? "OpaqueRef:NULL")
);
</script>

<style lang="postcss" scoped>
.text-error {
  padding-left: 3rem;
  font-weight: 700;
  font-size: 16px;
  line-height: 150%;
  color: var(--color-red-vates-base);
}
</style>
