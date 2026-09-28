<template>
  <UiHeadBar icon="object:kubernetes">
    {{ KUBERNETES_NAME }}
  </UiHeadBar>
  <TabList>
    <RouterLink v-slot="{ isExactActive, href }" :to="{ name: '/kubernetes/clusters' }" custom>
      <UiTabItem :active="isExactActive" :href tag="a">
        {{ t('clusters') }}
      </UiTabItem>
    </RouterLink>
  </TabList>
</template>

<script setup lang="ts">
import { KUBERNETES_NAME } from '@/shared/constants.ts'
import TabList from '@core/components/tab-list/TabList.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiTabItem from '@core/components/ui/tab-item/UiTabItem.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
