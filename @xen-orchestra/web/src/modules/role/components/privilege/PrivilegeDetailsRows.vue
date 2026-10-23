<template>
  <div class="privilege-details-rows">
    <VtsCardRowKeyValue>
      <template #key>{{ t('privilege') }}</template>
      <template #value>{{ privilege.id }}</template>
      <template #addons>
        <VtsCopyButton :value="privilege.id" />
      </template>
    </VtsCardRowKeyValue>
    <VtsCardRowKeyValue>
      <template #key>{{ t('privilege:resource') }}</template>
      <template #value>{{ privilege.resource }}</template>
      <template #addons>
        <VtsCopyButton :value="privilege.resource" />
      </template>
    </VtsCardRowKeyValue>
    <VtsCardRowKeyValue>
      <template #key>{{ t('privilege:selector') }}</template>
      <template #value>{{ privilege.selector }}</template>
      <template v-if="privilege.selector" #addons>
        <VtsCopyButton :value="privilege.selector" />
      </template>
    </VtsCardRowKeyValue>
    <VtsCardRowKeyValue>
      <template #key>{{ t('privilege:action') }}</template>
      <template #value>{{ privilege.action }}</template>
      <template #addons>
        <VtsCopyButton :value="privilege.action" />
      </template>
    </VtsCardRowKeyValue>
    <VtsCardRowKeyValue>
      <template #key>{{ t('privilege:effect') }}</template>
      <template #value>
        <UiTagsList>
          <UiTag :accent="EFFECT_ACCENTS[privilege.effect]" variant="secondary">
            {{ t(privilege.effect) }}
          </UiTag>
        </UiTagsList>
      </template>
    </VtsCardRowKeyValue>
  </div>
</template>

<script lang="ts" setup>
import type { FrontXoPrivilege } from '@/modules/role/remote-resources/use-xo-role-privileges-collection.ts'
import { EFFECT_ACCENTS } from '@/modules/role/utils/xo-privilege.util.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  privilege: FrontXoPrivilege
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.privilege-details-rows {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
</style>
