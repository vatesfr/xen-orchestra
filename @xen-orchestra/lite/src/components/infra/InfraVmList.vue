<template>
  <ul class="infra-vm-list">
    <template v-if="!isReady">
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

const { isReady, recordsByHostRef } = useVmStore().subscribe();

const vms = computed(() =>
  recordsByHostRef.value.get(props.hostOpaqueRef ?? "OpaqueRef:NULL")
);
</script>
