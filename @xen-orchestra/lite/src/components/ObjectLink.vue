<template>
  <template v-if="record !== undefined">
    <RouterLink v-if="objectRoute" :to="objectRoute">
      {{ record.name_label }}
    </RouterLink>
    <span v-else>{{ record.name_label }}</span>
  </template>
  <span v-else class="unknown">{{ $t("unknown") }}</span>
</template>

<script generic="T extends ObjectType" lang="ts" setup>
import type {
  ObjectType,
  ObjectTypeToRecord,
} from "@/libs/xen-api/xen-api.types";
import { useHostStore } from "@/stores/xen-api/host.store";
import { usePoolStore } from "@/stores/xen-api/pool.store";
import { useSrStore } from "@/stores/xen-api/sr.store";
import { useVmStore } from "@/stores/xen-api/vm.store";
import { computed, onUnmounted, watch } from "vue";

type AcceptedTypes = "host" | "vm" | "sr" | "pool";
type XRecord = ObjectTypeToRecord<T>;

const props = defineProps<{
  type: T;
  uuid: XRecord["uuid"];
}>();

const stores = {
  host: useHostStore,
  vm: useVmStore,
  sr: useSrStore,
  pool: usePoolStore,
} satisfies Record<AcceptedTypes, any>;

const store = computed(() => {
  return stores[props.type as AcceptedTypes]?.();
});

const subscriptionId = Symbol();

watch(
  store,
  (nextStore, previousStore) => {
    previousStore?.unsubscribe(subscriptionId);
    nextStore?.subscribe(subscriptionId);
  },
  { immediate: true }
);

onUnmounted(() => {
  store.value?.unsubscribe(subscriptionId);
});

const record = computed<ObjectTypeToRecord<AcceptedTypes> | undefined>(
  () => store.value?.getByUuid(props.uuid as any)
);

const routes: Partial<Record<ObjectType, string | undefined>> = {
  host: "host.dashboard",
  vm: "vm.console",
  pool: "pool.dashboard",
  sr: undefined,
} satisfies Record<AcceptedTypes, string | undefined>;

const objectRoute = computed(() => {
  if (routes[props.type] === undefined) {
    return;
  }

  return { name: routes[props.type], params: { uuid: props.uuid } };
});
</script>

<style lang="postcss" scoped>
.unknown {
  color: var(--color-blue-scale-300);
  font-style: italic;
}
</style>
