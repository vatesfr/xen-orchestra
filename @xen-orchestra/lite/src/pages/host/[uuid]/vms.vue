<template>
  <UiCard class="vms">
    <UiTitle>{{ t('vms', 2) }}</UiTitle>
    <VmsTable :vms :busy="!isReady" :error="hasError" />
  </UiCard>
</template>

<script lang="ts" setup>
import VmsTable from '@/components/vm/VmsTable.vue'
import type { XenApiHost } from '@/libs/xen-api/xen-api.types'
import { usePageTitleStore } from '@/stores/page-title.store'
import { useHostStore } from '@/stores/xen-api/host.store'
import { useVmStore } from '@/stores/xen-api/vm.store'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { logicAnd, logicOr } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const { t } = useI18n()

usePageTitleStore().setTitle(() => t('vms', 2))

const { isReady: isVmReady, hasError: hasVmError, recordsByHostRef } = useVmStore().subscribe()

const { isReady: isHostReady, hasError: hasHostError, getByUuid } = useHostStore().subscribe()

const isReady = logicAnd(isVmReady, isHostReady)

const hasError = logicOr(hasVmError, hasHostError)

const route = useRoute<'/host/[uuid]/vms'>()

const host = computed(() => getByUuid(route.params.uuid as XenApiHost['uuid']))

const vms = computed(() => (host.value ? (recordsByHostRef.value.get(host.value?.$ref) ?? []) : []))
</script>

<style lang="postcss" scoped>
.vms {
  margin: 0.8rem;
}
</style>
