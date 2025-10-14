<template>
  <UiCard class="card-container">
    <UiCardTitle>
      {{ t('hosts') }}
      <UiCounter :value="hosts.length" accent="neutral" size="small" variant="primary" />
    </UiCardTitle>
    <UiCollapsibleList tag="ul" :total-items="hosts.length">
      <li v-for="host in hosts" :key="host.id">
        <UiLink size="small" icon="fa:server" :to="`/host/${host.id}`">
          {{ host.name_label }}
        </UiLink>
      </li>
    </UiCollapsibleList>
  </UiCard>
</template>

<script lang="ts" setup>
import type { XoHost } from '@/types/xo/host.type'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCollapsibleList from '@core/components/ui/collapsible-list/UiCollapsibleList.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useI18n } from 'vue-i18n'

const { hosts } = defineProps<{
  hosts: XoHost[]
}>()

const { t } = useI18n()
</script>

<style scoped lang="postcss">
.card-container {
  gap: 1.6rem;
}
</style>
