<template>
  <VtsDrawer dismissible is-open :current @dismiss="emit('cancel')">
    <template #title>
      {{ t('action:migrate-vdi-on-sr') }}
    </template>

    <template #content>
      <VdiMigrateForm ref="form" :vdi @confirm="emit('confirm', $event)" />
    </template>

    <template #buttons>
      <VtsDrawerCancelButton />

      <VtsDrawerConfirmButton
        :accent="form?.requiresForceMigrate ? 'warning' : 'brand'"
        :on-click="() => form?.submit()"
      >
        {{ form?.requiresForceMigrate ? t('action:force-migrate-on-sr') : t('action:migrate-vdi-on-sr') }}
      </VtsDrawerConfirmButton>
    </template>
  </VtsDrawer>
</template>

<script lang="ts" setup>
import VdiMigrateForm from '@/modules/vdi/components/form/migrate/VdiMigrateForm.vue'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.js'
import VtsDrawer from '@xen-orchestra/web-core/components/drawer/VtsDrawer.vue'
import VtsDrawerCancelButton from '@xen-orchestra/web-core/components/drawer/VtsDrawerCancelButton.vue'
import VtsDrawerConfirmButton from '@xen-orchestra/web-core/components/drawer/VtsDrawerConfirmButton.vue'
import { useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  vdi: FrontXoVdi
  current?: boolean
}>()

const emit = defineEmits<{
  confirm: [srId: string]
  cancel: []
}>()

const { t } = useI18n()

const form = useTemplateRef('form')
</script>
