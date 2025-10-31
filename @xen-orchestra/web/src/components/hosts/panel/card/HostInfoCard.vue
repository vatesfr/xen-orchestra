<template>
  <UiCard>
    <UiCardTitle>
      <UiObjectLink :route="`/host/${host.id}/`">
        <template #icon>
          <VtsObjectIcon size="medium" :state="getHostState(host.power_state)" type="host" />
        </template>
        {{ host.name_label }}
      </UiObjectLink>
    </UiCardTitle>
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>{{ t('state') }}</template>
        <template #value>
          <span class="power-state">
            <VtsIcon :name="powerState.icon" size="medium" />
            {{ powerState.text }}
          </span>
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('uuid') }}</template>
        <template #value>{{ host.id }}</template>
        <template #addons>
          <VtsCopyButton :value="host.id" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue wrap>
        <template #key>{{ t('description') }}</template>
        <template #value>{{ host.name_description }}</template>
        <template #addons>
          <VtsCopyButton :value="host.name_description" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('tags') }}</template>
        <template #value>
          <UiTagsList v-if="host.tags.length > 0">
            <UiTag v-for="tag in host.tags" :key="tag" accent="info" variant="secondary">
              {{ tag }}
            </UiTag>
          </UiTagsList>
        </template>
        <template v-if="host.tags.length > 0" #addons>
          <VtsCopyButton :value="host.tags.join(', ')" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('status') }}</template>
        <template #value>
          <VtsEnabledState :enabled="host.enabled" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('pool') }}</template>
        <template #value>
          <div v-if="pool" class="pool-name">
            <VtsIcon name="fa:city" size="medium" />
            <UiLink :to="`/pool/${pool.id}`" size="small">
              {{ pool.name_label }}
            </UiLink>
          </div>
        </template>
        <template v-if="pool" #addons>
          <VtsCopyButton :value="pool.id" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('master') }}</template>
        <template #value>
          <div v-if="getIsMaster(host.id)" class="primary-host">
            <VtsIcon v-tooltip="t('master')" name="legacy:primary" size="medium" />
            {{ t('this-host') }}
          </div>
          <div v-else-if="masterHost !== undefined" class="primary-host">
            <UiObjectLink :route="`/host/${masterHost.id}/`">
              <template #icon>
                <VtsObjectIcon size="medium" :state="getHostState(masterHost.power_state)" type="host" />
              </template>
              {{ masterHost.id }}
            </UiObjectLink>
          </div>
        </template>
        <template v-if="masterHost !== undefined" #addons>
          <VtsCopyButton :value="masterHost.id" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('started') }}</template>
        <template #value>{{ relativeStartTime }}</template>
        <template #addons>
          <VtsCopyButton :value="relativeStartTime" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('patches') }}</template>
        <template v-if="!missingPatch.length" #value>
          <UiInfo accent="success">{{ t('patches-up-to-date') }}</UiInfo>
        </template>
        <template v-else #value>
          <UiInfo accent="warning">{{ t('n-missing', missingPatch.length) }}</UiInfo>
        </template>
        <template #addons>
          <VtsCopyButton :value="missingPatch.length ? t('n-missing', missingPatch.length) : t('patches-up-to-date')" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoHostUtils } from '@/composables/xo-host.composable'
import { useXoHostMissingPatchesCollection } from '@/remote-resources/use-xo-host-missing-patches-collection'
import type { XoHost } from '@/types/xo/host.type'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsEnabledState from '@core/components/enabled-state/VtsEnabledState.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiObjectLink from '@core/components/ui/object-link/UiObjectLink.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XoHost
}>()

const { t } = useI18n()

const { getHostState, getIsMaster, getMasterHostFromPoolId, getPool, getPowerState, getRelativeStartTime } =
  useXoHostUtils()

const { hostMissingPatches: missingPatch } = useXoHostMissingPatchesCollection({}, () => host.id)

const pool = getPool(host.$pool)
const relativeStartTime = getRelativeStartTime(host.startTime)

const masterHost = computed(() => getMasterHostFromPoolId(host.$pool))
const powerState = computed(() => getPowerState(host.power_state))
</script>

<style scoped lang="postcss">
.content {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  .power-state,
  .pool-name,
  .primary-host {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }
}
</style>
