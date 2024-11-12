<template>
  <TitleBar :icon="faServer">
    {{ name }}
  </TitleBar>
</template>

<script lang="ts" setup>
import TitleBar from '@/components/TitleBar.vue'
import type { XenApiHost } from '@/libs/xen-api/xen-api.types'
import { useHostStore } from '@/stores/xen-api/host.store'
import { faServer } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const { getByUuid: getHostByUuid } = useHostStore().subscribe()
const route = useRoute()

const host = computed(() => getHostByUuid(route.params.uuid as XenApiHost['uuid']))

const name = computed(() => host.value?.name_label)
</script>
