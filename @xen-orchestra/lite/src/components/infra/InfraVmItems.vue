<template>
  <VtsTreeItemError v-if="hasError">{{ t('error-no-data') }}</VtsTreeItemError>
  <template v-else-if="!isReady">
    <VtsTreeLoadingItem v-for="i in 3" :key="i" :icon="faDisplay" />
  </template>
  <InfraVmItem v-for="vm in vms" :key="vm.$ref" :vm-opaque-ref="vm.$ref" />
</template>

<script lang="ts" setup>
import InfraVmItem from '@/components/infra/InfraVmItem.vue'
import type { XenApiHost } from '@/libs/xen-api/xen-api.types'
import { useVmStore } from '@/stores/xen-api/vm.store'
import VtsTreeItemError from '@core/components/tree/VtsTreeItemError.vue'
import VtsTreeLoadingItem from '@core/components/tree/VtsTreeLoadingItem.vue'
import { faDisplay } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  hostOpaqueRef?: XenApiHost['$ref']
}>()

const { t } = useI18n()

const { isReady, recordsByHostRef, hasError } = useVmStore().subscribe()

const vms = computed(() => recordsByHostRef.value.get(props.hostOpaqueRef ?? ('OpaqueRef:NULL' as XenApiHost['$ref'])))
</script>
