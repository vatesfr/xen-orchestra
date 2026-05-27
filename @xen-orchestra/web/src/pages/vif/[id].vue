<template>
  <VtsStateHero v-if="!areVifsReady" format="page" type="busy" size="large" />
  <VtsStateHero v-else-if="!vif" format="page" type="not-found" size="large">
    {{ t('object-not-found', { id: route.params.id }) }}
  </VtsStateHero>
  <RouterView v-else v-slot="{ Component }">
    <VifHeader :vif />
    <component :is="Component" :vif />
  </RouterView>
</template>

<script lang="ts" setup>
import VifHeader from '@/modules/vif/components/VifHeader.vue'
import { type FrontXoVif, useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const route = useRoute<'/vif/[id]'>()

const { t } = useI18n()

const { areVifsReady, useGetVifById } = useXoVifCollection()

const vif = useGetVifById(() => route.params.id as FrontXoVif['id'])
</script>
