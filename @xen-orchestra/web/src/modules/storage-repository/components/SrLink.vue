<template>
  <UiLink
    :to="{ name: '/sr/[id]/general', params: { id: sr.id } }"
    size="small"
    :icon="srStatusIcon"
    :is-primary="isDefaultSr(sr)"
    :primary-tooltip="t('default-storage-repository')"
  >
    {{ sr.name_label }}
  </UiLink>
</template>

<script lang="ts" setup>
import { useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import {
  type FrontXoSr,
  useXoSrCollection,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useI18n } from 'vue-i18n'

const { sr } = defineProps<{
  sr: FrontXoSr
}>()

const { t } = useI18n()

const { isDefaultSr } = useXoSrCollection()

const { srStatusIcon } = useXoSrUtils(() => sr)
</script>
