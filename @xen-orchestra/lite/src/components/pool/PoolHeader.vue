<template>
  <UiHeadBar icon="object:pool">
    {{ name }}
    <template #actions>
      <UiLink size="medium" :to="{ name: '/vm/new' }" icon="fa:plus">
        {{ t('new-vm') }}
      </UiLink>
    </template>
  </UiHeadBar>
</template>

<script lang="ts" setup>
import { usePoolStore } from '@/stores/xen-api/pool.store'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { pool } = usePoolStore().subscribe()

const { t } = useI18n()

const name = computed(() => pool.value?.name_label ?? '...')
</script>
