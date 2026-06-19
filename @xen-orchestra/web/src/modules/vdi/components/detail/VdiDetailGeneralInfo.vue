<template>
  <UiCard>
    <UiTitle>
      {{ t('general-information') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('name')" :value="vdi ? vdi.name_label : snapshot?.name_label" />
      <VtsTabularKeyValueRow :label="t('uuid')" :value="vdi ? vdi.uuid : snapshot?.uuid" />
      <VtsTabularKeyValueRow
        :label="t('description')"
        :value="vdi ? vdi.name_description : snapshot?.name_description"
      />

      <VtsTabularKeyValueRow v-if="vdi" :label="t('tags')">
        <template v-if="vdi.tags.length > 0" #value>
          <UiTagsList>
            <VtsTag v-for="tag in vdi.tags" :key="tag" :value="tag" />
          </UiTagsList>
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow v-if="snapshot" :label="t('tags')">
        <template v-if="snapshot.tags.length > 0" #value>
          <UiTagsList>
            <VtsTag v-for="tag in snapshot.tags" :key="tag" :value="tag" />
          </UiTagsList>
        </template>
      </VtsTabularKeyValueRow>

      <VtsTabularKeyValueRow v-if="vdi" :label="t('status')">
        <template #value>
          <VtsStatus :status="vbd?.attached ? CONNECTION_STATUS.CONNECTED : CONNECTION_STATUS.DISCONNECTED" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow v-if="snapshot" :label="t('status')">
        <template #value>
          <VtsStatus :status="snapshot.$VBDs ? CONNECTION_STATUS.CONNECTED : CONNECTION_STATUS.DISCONNECTED" />
        </template>
      </VtsTabularKeyValueRow>

      <VtsTabularKeyValueRow v-if="vdi" :label="t('device')" :value="vbd?.device ?? '-'" />
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVdiSnapshot } from '@/modules/vdi/remote-resources/use-xo-vdi-snapshot-collection.ts'
import { CONNECTION_STATUS } from '@/shared/constants.ts'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  vdi?: FrontXoVdi
  vbd?: FrontXoVbd
  snapshot?: FrontXoVdiSnapshot
}>()

const { t } = useI18n()
</script>
