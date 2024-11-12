<template>
  <PageUnderConstruction />
</template>

<script lang="ts" setup>
import PageUnderConstruction from '@/components/PageUnderConstruction.vue'
import { usePageTitleStore } from '@/stores/page-title.store'
import { useI18n } from 'vue-i18n'

usePageTitleStore().setTitle(useI18n().t('console'))
</script>
