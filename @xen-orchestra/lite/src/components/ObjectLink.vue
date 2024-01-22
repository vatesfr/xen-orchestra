<template>
  <div class="object-link">
    <UiSpinner v-if="!isReady" />
    <template v-else-if="record !== undefined">
      <RouterLink v-if="objectRoute" :to="objectRoute">
        {{ record.name_label }}
      </RouterLink>
      <span v-else>{{ record.name_label }}</span>
    </template>
    <span v-else class="unknown">{{ uuid }}</span>
  </div>
</template>

<script generic="T extends ObjectType" lang="ts" setup>
import UiSpinner from '@/components/ui/UiSpinner.vue'
import type { ObjectType, ObjectTypeToRecord } from '@/libs/xen-api/xen-api.types'
import { useHostStore } from '@/stores/xen-api/host.store'
import { usePoolStore } from '@/stores/xen-api/pool.store'
import { useSrStore } from '@/stores/xen-api/sr.store'
import { useVmStore } from '@/stores/xen-api/vm.store'
import type { StoreDefinition } from 'pinia'
import { computed, onUnmounted, watch } from 'vue'
import type { RouteRecordName } from 'vue-router'

type HandledTypes = 'host' | 'vm' | 'sr' | 'pool'
type XRecord = ObjectTypeToRecord<T>
type Config = Partial<
  Record<
    ObjectType,
    {
      useStore: StoreDefinition<any, any, any, any>
      routeName: RouteRecordName | undefined
    }
  >
>

const props = defineProps<{
  type: T
  uuid: XRecord['uuid']
}>()

const config: Config = {
  host: { useStore: useHostStore, routeName: 'host.dashboard' },
  vm: { useStore: useVmStore, routeName: 'vm.console' },
  sr: { useStore: useSrStore, routeName: undefined },
  pool: { useStore: usePoolStore, routeName: 'pool.dashboard' },
} satisfies Record<HandledTypes, any>

const store = computed(() => config[props.type]?.useStore())

const subscriptionId = Symbol('OBJECT_LINK_SUBSCRIPTION_ID')

watch(
  store,
  (nextStore, previousStore) => {
    previousStore?.unsubscribe(subscriptionId)
    nextStore?.subscribe(subscriptionId)
  },
  { immediate: true }
)

onUnmounted(() => {
  store.value?.unsubscribe(subscriptionId)
})

const record = computed<ObjectTypeToRecord<HandledTypes> | undefined>(() => store.value?.getByUuid(props.uuid as any))

const isReady = computed(() => {
  return store.value?.isReady ?? true
})

const objectRoute = computed(() => {
  const { routeName } = config[props.type] ?? {}

  if (routeName === undefined) {
    return
  }

  return {
    name: routeName,
    params: { uuid: props.uuid },
  }
})
</script>

<style lang="postcss" scoped>
.unknown {
  color: var(--color-grey-300);
  font-style: italic;
}
</style>
