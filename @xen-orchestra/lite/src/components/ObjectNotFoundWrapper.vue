<template>
  <ObjectNotFoundView :id="id" v-if="isRecordNotFound" />
  <slot v-else />
</template>
<script lang="ts" setup>
import ObjectNotFoundView from "@/views/ObjectNotFoundView.vue";
import { useHostStore } from "@/stores/host.store";
import { useVmStore } from "@/stores/vm.store";
import { computed } from "vue";
import { useRouter } from "vue-router";

const storeByType = {
  vm: useVmStore,
  host: useHostStore,
};

const props = defineProps<{ objectType: "vm" | "host"; id?: string }>();

const store = storeByType[props.objectType]();
const { currentRoute } = useRouter();

const id = computed(
  () => props.id ?? (currentRoute.value.params.uuid as string)
);
const isRecordNotFound = computed(
  () => store.isReady && !store.hasRecordByUuid(id.value)
);
</script>
