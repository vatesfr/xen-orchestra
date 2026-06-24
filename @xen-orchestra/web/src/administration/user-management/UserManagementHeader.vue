<template>
  <UiHeadBar>
    {{ t('user-management') }}
    <template #icon>
      <VtsIcon name="object:organization" size="medium" />
    </template>
  </UiHeadBar>
  <TabList>
    <TabItem active tag="a">
      {{ t('users') }}
    </TabItem>
  </TabList>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import TabItem from '@core/components/tab/TabItem.vue'
import TabList from '@core/components/tab/TabList.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
