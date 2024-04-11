<template>
  Deferred Host + VM Subscriptions
  <hr />
  <button @click.prevent="start()">Start</button>
</template>

<script lang="ts" setup>
import { usePageTitleStore } from '@/stores/page-title.store'
import { useNewHostStore } from '@/stores/xen-api-new/host.store'
import { useNewVmStore } from '@/stores/xen-api-new/vm.store'
import { useI18n } from 'vue-i18n'
import { onBeforeRouteLeave } from 'vue-router'

usePageTitleStore().setTitle(useI18n().t('system'))

const hostStore = useNewHostStore()
const vmStore = useNewVmStore()

const hostSubscription = hostStore.subscribe({ defer: true })
const vmSubscription = vmStore.subscribe({ defer: true })

function start() {
  hostSubscription.start()
  vmSubscription.start()
}

// eslint-disable-next-line no-console
onBeforeRouteLeave(() => console.log('-'.repeat(20)))
</script>
