<template>
  <UiHeadBar>
    {{ label }}
    <template #icon>
      <VtsIcon size="medium" name="object:vdi-snapshot" />
    </template>
  </UiHeadBar>
</template>

<script setup lang="ts">
import type { FrontXoVdiSnapshot } from '@/modules/vdi/remote-resources/use-xo-vdi-snapshot-collection.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vdiSnapshot } = defineProps<{
  vdiSnapshot: FrontXoVdiSnapshot
}>()

const { t } = useI18n()

const label = computed(() => {
  if (vdiSnapshot.name_label.length > 0) {
    return vdiSnapshot.name_label
  }
  return t('unknown')
})
</script>
