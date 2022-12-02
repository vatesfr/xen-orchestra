<template>
  <NotFoundView v-if="isRecordNotFound" />
  <slot v-else />
</template>
<script lang="ts" setup>
import NotFoundView from "@/views/NotFoundView.vue";
import { useHostStore } from "@/stores/host.store";
import { useVmStore } from "@/stores/vm.store";
import { computed } from "vue";
import { useRouter } from "vue-router";

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
const { currentRoute } = useRouter();

const isRecordNotFound = computed(
  () =>
    store.isReady &&
    !store.hasRecordByUuid(
      props.id ?? (currentRoute.value.params.uuid as string)
    )
);
</script>
