<template>
  <UiHeadBar :icon="faBuilding">
    {{ name }}
    <template #actions>
      <UiLink :left-icon="faPlus" variant="primary" accent="brand" size="medium" @click="goToNewVm()">
        {{ $t('new-vm') }}
      </UiLink>
    </template>
  </UiHeadBar>
</template>

<script lang="ts" setup>
import { usePoolStore } from '@/stores/xen-api/pool.store'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { faBuilding } from '@fortawesome/free-regular-svg-icons'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const { pool } = usePoolStore().subscribe()

const name = computed(() => pool.value?.name_label ?? '...')

const goToNewVm = () => router.push({ name: 'new-vm' })
</script>
