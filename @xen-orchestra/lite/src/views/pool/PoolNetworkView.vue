<template>VM Subscription only</template>

<script lang="ts" setup>
import { usePageTitleStore } from '@/stores/page-title.store'
import { useNewVmStore } from '@/stores/xen-api-new/vm.store'
import { useI18n } from 'vue-i18n'
import { onBeforeRouteLeave } from 'vue-router'

usePageTitleStore().setTitle(useI18n().t('network'))

const vmStore = useNewVmStore()

vmStore.subscribe()

// eslint-disable-next-line no-console
onBeforeRouteLeave(() => console.log('-'.repeat(20)))
</script>
