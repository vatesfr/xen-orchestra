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
import VtsIcon from '@xen-orchestra/web-core/components/icon/VtsIcon.vue'
import TabItem from '@xen-orchestra/web-core/components/tab/TabItem.vue'
import TabList from '@xen-orchestra/web-core/components/tab/TabList.vue'
import UiHeadBar from '@xen-orchestra/web-core/components/ui/head-bar/UiHeadBar.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
