<template>
  <MainLayout>
    <UiCard color="info">
      <div>Welcome on XO 6 main page</div>
      <div>
        Demo icon from web-core:
        <UiIcon :icon="faRocket" />
      </div>
      <div>
        <button type="button" @click="toggleDark()">
          Toggle Dark Mode {{ isDark ? 'OFF' : 'ON' }}
        </button>
      </div>
    </UiCard>
  </MainLayout>
</template>

<script lang="ts" setup>
import { faRocket } from '@fortawesome/free-solid-svg-icons/faRocket'
import { useDark, useToggle } from '@vueuse/core'
import UiCard from '@xen-orchestra/web-core/components/ui/UiCard.vue'
import UiIcon from '@xen-orchestra/web-core/components/ui/UiIcon.vue'
import MainLayout from '@/layouts/MainLayout.vue'

const isDark = useDark()
const toggleDark = useToggle(isDark)
</script>
