<template>
  <slot />
</template>
<script lang="ts" setup>
import { useRedirectIfNotFound } from "@/composables/redirect-if-not-found.composable";
import { useHostStore } from "@/stores/host.store";
import { useVmStore } from "@/stores/vm.store";

const storeByType = {
  vm: useVmStore,
  host: useHostStore,
};

type Props = {
  objectType: "vm" | "host";
  id?: string;
  routeName?: string;
};
const props = withDefaults(defineProps<Props>(), {
  routeName: "notFound",
});

const store = storeByType[props.objectType]();

useRedirectIfNotFound(
  () => store.isReady,
  (route) =>
    store.getRecordByUuid(props.id ?? (route.params.uuid as string)) !==
    undefined,
  props.routeName
);
</script>
