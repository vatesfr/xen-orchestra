<template>
  <UiCard class="card-container">
    <UiCardTitle>
      <UiLink
        v-if="vm.name_label !== ''"
        size="medium"
        :icon="`object:vm:${toLower(vm.power_state)}`"
        :to="`/vm/${vm.id}/dashboard`"
      >
        {{ vm.name_label }}
      </UiLink>
    </UiCardTitle>
    <div class="content">
      <VtsCodeSnippet :content="vm.id" copy />
      <VtsCardRowKeyValue>
        <template #key>{{ t('state') }}</template>
        <template #value>
          <div class="value">
            <VtsIcon :name="powerState.icon" size="medium" />
            {{ powerState.text }}
          </div>
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue truncate align-top>
        <template #key>{{ t('description') }}</template>
        <template #value>{{ vm.name_description }}</template>
        <template v-if="vm.name_description" #addons>
          <VtsCopyButton :value="vm.name_description" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue align-top>
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
          <div v-if="pool" class="value">
            <UiLink :to="`/pool/${pool.id}/dashboard`" size="small" icon="object:pool">
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
          <div v-if="host" class="value">
            <UiLink :to="`/host/${host.id}/dashboard`" size="small" :icon="`object:host:${hostPowerState}`">
              {{ host.name_label }}
            </UiLink>
            <VtsIcon v-if="isMaster" v-tooltip="t('master')" name="status:primary-circle" size="small" />
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
          <div class="value">
            <VtsIcon
              v-if="guestToolsDisplay.value !== '-'"
              v-tooltip="guestToolsDisplay.tooltip"
              :name="guestToolsDisplay.type === 'link' ? 'status:halted-circle' : 'status:success-circle'"
              size="medium"
            />
            <UiLink v-if="guestToolsDisplay.type === 'link'" size="small" :href="XCP_LINKS.GUEST_TOOLS">
              {{ guestToolsDisplay.value }}
            </UiLink>
            <template v-else>
              <span v-tooltip class="text-ellipsis"> {{ guestToolsDisplay.value }}</span>
            </template>
          </div>
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('template') }}</template>
        <template #value>
          <div class="value">
            <VtsIcon name="fa:template" size="medium" />
            <UiLink v-if="template" size="small" :href="xo5VmTemplateHref">
              {{ template.name_label }}
            </UiLink>
            <span v-else>{{ vm.other.base_template_name }}</span>
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
          <div class="value">
            <UiUserLogo size="extra-small" class="user-logo" />
            <UiLink v-if="userLabel" size="small" :href="xo5UserHref">
              {{ userLabel }}
            </UiLink>
            <span v-else>{{ t('unknown') }}</span>
          </div>
        </template>
        <template v-if="userLabel" #addons>
          <VtsCopyButton :value="userLabel" />
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
import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoUserResource } from '@/modules/user/remote-resources/use-xo-user.ts'
import { useXoVmUtils } from '@/modules/vm/composables/xo-vm-utils.composable.ts'
import { useXoVmCollection, type FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useXoVmTemplateCollection } from '@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'
import { XCP_LINKS } from '@/shared/constants.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCodeSnippet from '@core/components/code-snippet/VtsCodeSnippet.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import UiUserLogo from '@core/components/ui/user-logo/UiUserLogo.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { HOST_POWER_STATE } from '@vates/types'
import { toLower } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const { buildXo5Route } = useXoRoutes()

const { useGetPoolById } = useXoPoolCollection()
const { getVmHost } = useXoVmCollection()
const { isMasterHost } = useXoHostCollection()

const { user } = useXoUserResource({}, () => vm.creation?.user)

const xo5UserHref = computed(() => (user.value !== undefined ? buildXo5Route(`/users/${user.value.id}`) : undefined))

const userLabel = computed(() => user.value?.name || user.value?.email)

const { templates } = useXoVmTemplateCollection()

const template = computed(() => {
  return templates.value.find(template => template.uuid === vm.creation?.template && template.$pool === vm.$pool)
})

const xo5VmTemplateHref = computed(() =>
  template.value !== undefined ? buildXo5Route(`/home?p=1&s=${template.value.id}&t=VM-template`) : undefined
)

const pool = useGetPoolById(() => vm.$pool)

const host = computed(() => getVmHost(vm))

const isMaster = computed(() => (host.value !== undefined ? isMasterHost(host.value.id) : false))

const hostPowerState = computed(() =>
  host.value ? toLower(host.value.power_state) : toLower(HOST_POWER_STATE.UNKNOWN)
)

const { powerState, installDateFormatted, relativeStartTime, guestToolsDisplay } = useXoVmUtils(() => vm)
</script>

<style scoped lang="postcss">
.card-container {
  gap: 1.6rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;

    .value {
      display: flex;
      align-items: center;
      gap: 0.8rem;
    }

    .user-logo {
      flex-shrink: 0;
    }
  }
}
</style>
