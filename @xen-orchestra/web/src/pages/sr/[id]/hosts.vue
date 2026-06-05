<template>
  <VtsColumns extra-space-around>
    <UiCard class="container">
      <div class="content">
        <!-- WIP: hosts -->
        <HostsTable :hosts="hosts" />
      </div>
    </UiCard>
  </VtsColumns>
</template>

<script setup lang="ts">
import HostsTable from '@/modules/host/components/list/HostsTable.vue'
import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import VtsColumns from '@core/components/columns/VtsColumns.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { computed } from 'vue'

const { sr } = defineProps<{
  sr: FrontXoSr
}>()

const { pbdsBySr } = useXoPbdCollection()
const { getHostById } = useXoHostCollection()

const pbds = computed(() => pbdsBySr.value.get(sr.id))

const hosts = computed(() => (pbds.value ?? []).map(pbd => getHostById(pbd.host)).filter(host => host !== undefined))
</script>
