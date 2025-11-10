<template>
  <UiCard class="card-container">
    <UiCardTitle>
      <UiLink v-if="vm.name_label !== undefined" size="medium" icon="fa:desktop" :to="`/vm/${vm.id}/dashboard`">
        {{ vm.name_label }}
      </UiLink>
    </UiCardTitle>
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>{{ t('state') }}</template>
        <template #value>
          <div class="power-state">
            <VtsIcon :name="powerState.icon" size="medium" />
            {{ powerState.text }}
          </div>
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('uuid') }}</template>
        <template #value>{{ vm.id }}</template>
        <template #addons>
          <VtsCopyButton :value="vm.id" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('description') }}</template>
        <template #value>{{ vm.name_description }}</template>
        <template v-if="vm.name_description" #addons>
          <VtsCopyButton :value="vm.name_description" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('tags') }}</template>
        <template #value>
          <UiTagsList v-if="vm.tags.length > 0">
            <UiTag v-for="tag in vm.tags" :key="tag" accent="info" variant="secondary">{{ tag }}</UiTag>
          </UiTagsList>
        </template>
        <template v-if="vm.tags.length > 0" #addons>
          <VtsCopyButton :value="vm.tags.join(', ')" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('pool') }}</template>
        <template #value>
          <div v-if="pool" class="pool-name">
            <VtsIcon name="fa:city" size="small" />
            <UiLink :to="`/pool/${pool.id}/dashboard`" size="small">
              {{ pool.name_label }}
            </UiLink>
          </div>
        </template>
        <template v-if="pool" #addons>
          <VtsCopyButton :value="pool.name_label" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('host') }}</template>
        <template #value>
          <div v-if="host" class="host-name">
            <VtsObjectIcon type="host" :state="hostPowerState" size="small" />
            <UiLink :to="`/host/${host.id}/dashboard`" size="small">
              {{ host.name_label }}
            </UiLink>
            <VtsIcon v-if="isMaster" v-tooltip="t('master')" name="legacy:primary" size="small" />
          </div>
        </template>
        <template v-if="host" #addons>
          <VtsCopyButton :value="host.name_label" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('os-name') }}</template>
        <template #value>{{ vm.os_version?.name }}</template>
        <template v-if="vm.os_version?.name" #addons>
          <VtsCopyButton :value="vm.os_version?.name" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('guest-tools') }}</template>
        <template #value>
          <div class="guest-tools">
            <VtsIcon
              v-if="guestToolsDisplay.value !== '-'"
              v-tooltip="guestToolsDisplay.tooltip"
              :name="guestToolsDisplay.type === 'link' ? 'legacy:halted' : 'legacy:checked'"
              size="medium"
            />
            <template v-if="guestToolsDisplay.type === 'link'">
              <UiLink size="small" href="https://docs.xcp-ng.org/vms/#guest-tools">
                {{ guestToolsDisplay.value }}
              </UiLink>
            </template>
            <template v-else>
              {{ guestToolsDisplay.value }}
            </template>
          </div>
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('template') }}</template>
        <template #value>
          <div class="template">
            <VtsIcon name="fa:template" size="medium" />
            {{ vm.other.base_template_name }}
          </div>
        </template>
        <template v-if="vm.other.base_template_name" #addons>
          <VtsCopyButton :value="vm.other.base_template_name" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('created-on') }}</template>
        <template #value>{{ installDateFormatted }}</template>
        <template v-if="installDateFormatted" #addons>
          <VtsCopyButton :value="installDateFormatted" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('created-by') }}</template>
        <template #value>
          <div class="user">
            <UiUserLogo size="extra-small" />
            {{ user?.email ?? t('unknown') }}
          </div>
        </template>
        <template v-if="user?.email" #addons>
          <VtsCopyButton :value="user?.email" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('started') }}</template>
        <template #value>{{ relativeStartTime }}</template>
        <template v-if="relativeStartTime" #addons>
          <VtsCopyButton :value="relativeStartTime" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoVmUtils } from '@/composables/xo-vm-utils.composable.ts'
import { useXoPoolCollection } from '@/remote-resources/use-xo-pool-collection.ts'
import { useXoUserResource } from '@/remote-resources/use-xo-user.ts'
import { type XoVm } from '@/types/xo/vm.type.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import UiUserLogo from '@core/components/ui/user-logo/UiUserLogo.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XoVm
}>()

const { t } = useI18n()

const { useGetPoolById } = useXoPoolCollection()

const { user } = useXoUserResource({}, () => vm.creation?.user)

const pool = useGetPoolById(() => vm.$pool)

const { powerState, host, isMaster, hostPowerState, installDateFormatted, relativeStartTime, guestToolsDisplay } =
  useXoVmUtils(() => vm)
</script>

<style scoped lang="postcss">
.card-container {
  gap: 1.6rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;

    .power-state,
    .host-name,
    .pool-name,
    .guest-tools,
    .user,
    .template {
      display: flex;
      align-items: center;
      gap: 0.8rem;
    }
  }
}
</style>
