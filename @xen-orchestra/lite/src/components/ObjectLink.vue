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
import type { XapiContext } from '@/stores/xen-api/create-xapi-store-config'
import { useHostStore } from '@/stores/xen-api/host.store'
import { usePoolStore } from '@/stores/xen-api/pool.store'
import { useSrStore } from '@/stores/xen-api/sr.store'
import { useVmStore } from '@/stores/xen-api/vm.store'
import { computed, watch } from 'vue'
import type { RouteRecordName } from 'vue-router'

type HandledTypes = 'host' | 'vm' | 'sr' | 'pool'
type XRecord = ObjectTypeToRecord<T>
type Config = Partial<
  Record<
    ObjectType,
    {
      context: XapiContext<any> & { start: () => void; stop: () => void }
      routeName: RouteRecordName | undefined
    }
  >
>

const props = defineProps<{
  type: T
  uuid: XRecord['uuid']
}>()

const config: Config = {
  host: { context: useHostStore().subscribe({ defer: true }), routeName: 'host.console' },
  vm: { context: useVmStore().subscribe({ defer: true }), routeName: 'vm.console' },
  sr: { context: useSrStore().subscribe({ defer: true }), routeName: undefined },
  pool: { context: usePoolStore().subscribe({ defer: true }), routeName: 'pool.dashboard' },
} satisfies Record<HandledTypes, any>

const context = computed(() => config[props.type]?.context)

watch(
  context,
  (nextContext, previousContext) => {
    previousContext?.stop()
    nextContext?.start()
  },
  { immediate: true }
)

const record = computed(() => context.value?.getByUuid(props.uuid as any))

const isReady = computed(() => {
  return context.value?.isReady.value ?? true
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
  color: var(--color-neutral-txt-secondary);
  font-style: italic;
}
</style>
