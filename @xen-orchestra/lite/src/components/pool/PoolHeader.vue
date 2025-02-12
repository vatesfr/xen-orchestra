<template>
  <TitleBar :icon="faBuilding">
    {{ name }}
    <template #actions>
      <UiButton :left-icon="faPlus" variant="primary" accent="brand" size="medium" @click="goToNewVm">
        {{ $t('new-vm') }}
      </UiButton>
    </template>
  </TitleBar>
</template>

<script lang="ts" setup>
import TitleBar from '@/components/TitleBar.vue'
import { usePoolStore } from '@/stores/xen-api/pool.store'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { faBuilding } from '@fortawesome/free-regular-svg-icons'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const { pool } = usePoolStore().subscribe()

const name = computed(() => pool.value?.name_label ?? '...')

const goToNewVm = () => router.push({ name: 'new-vm' })
</script>
