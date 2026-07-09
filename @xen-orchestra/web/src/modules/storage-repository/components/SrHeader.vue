<template>
  <UiHeadBar icon="object:sr">{{ sr.name_label }}</UiHeadBar>
  <TabList>
    <RouterLink v-slot="{ isActive, href }" :to="{ name: '/sr/[id]/general', params: { id: sr.id } }" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ t('general') }}
      </TabItem>
    </RouterLink>
  </TabList>
</template>

<script setup lang="ts">
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import TabItem from '@core/components/tab/TabItem.vue'
import TabList from '@core/components/tab/TabList.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { useI18n } from 'vue-i18n'

defineProps<{ sr: FrontXoSr }>()

const { t } = useI18n()
</script>
