<template>
  <UiCard>
    <UiTitle>
      {{ t('general-information') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('name')" :value="vm.name_label" />
      <VtsTabularKeyValueRow :label="t('id')" :value="vm.id" />
      <VtsTabularKeyValueRow :label="t('description')" :value="vm.name_description" />
      <VtsTabularKeyValueRow :label="t('tags')">
        <template v-if="vm.tags.length > 0" #value>
          <UiTagsList>
            <VtsTag v-for="tag in vm.tags" :key="tag" :value="tag" />
          </UiTagsList>
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('os-name')" :value="vm.os_version?.name" />
      <VtsTabularKeyValueRow :label="t('os-kernel')" :value="vm.os_version?.uname" />
      <VtsTabularKeyValueRow :label="t('management-agent-version')" :value="vm.pvDriversVersion" />
      <VtsTabularKeyValueRow :label="t('guest-tools')">
        <template #value>
          <div class="guest-tools-value">
            <VtsIcon
              v-if="guestToolsDisplay.type !== 'not-applicable'"
              v-tooltip="guestToolsDisplay.tooltip"
              :name="guestToolsIcon"
              size="medium"
            />
            <UiLink v-if="guestToolsDisplay.type === 'missing'" size="small" :href="XCP_LINKS.GUEST_TOOLS">
              {{ guestToolsDisplay.value }}
            </UiLink>
            <template v-else>
              <span v-tooltip class="text-ellipsis">{{ guestToolsDisplay.value }}</span>
            </template>
          </div>
        </template>
      </VtsTabularKeyValueRow>
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoVmUtils } from '@/modules/vm/composables/xo-vm-utils.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { XCP_LINKS } from '@/shared/constants.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{ vm: FrontXoVm }>()

const { t } = useI18n()

const { guestToolsDisplay, guestToolsIcon } = useXoVmUtils(() => vm)
</script>

<style scoped lang="postcss">
.guest-tools-value {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}
</style>
