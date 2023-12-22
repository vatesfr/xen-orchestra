<template>
  <MainLayout>
    <UiCard color="info">
      <div>Welcome on XO Lite main page</div>
      <div>
        Demo icon from web-core:
        <UiIcon :icon="faShip" />
      </div>
      <div>
        <button
          type="button"
          @click="toggleDark()"
        >
          Toggle Dark Mode {{ isDark ? 'OFF' : 'ON' }}
        </button>
      </div>
    </UiCard>
  </MainLayout>
</template>

<script lang="ts" setup>
import { faShip } from '@fortawesome/free-solid-svg-icons/faShip'
import { useDark, useToggle } from '@vueuse/core'
import UiCard from '@xen-orchestra/web-core/components/ui/UiCard.vue'
import UiIcon from '@xen-orchestra/web-core/components/ui/UiIcon.vue'
import MainLayout from '@/layouts/MainLayout.vue'

const isDark = useDark()
const toggleDark = useToggle(isDark)
</script>
