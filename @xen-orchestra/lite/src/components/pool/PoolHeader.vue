<template>
  <UiHeadBar :icon="faCity">
    {{ name }}
    <template #actions>
      <RouterLink :to="{ name: 'new-vm' }">
        <UiButton :left-icon="faPlus" variant="primary" accent="brand" size="medium">{{ t('new-vm') }}</UiButton>
      </RouterLink>
    </template>
  </UiHeadBar>
</template>

<script lang="ts" setup>
import { usePoolStore } from '@/stores/xen-api/pool.store'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { faCity, faPlus } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { pool } = usePoolStore().subscribe()

const { t } = useI18n()

const name = computed(() => pool.value?.name_label ?? '...')
</script>
