<template>
  <component :is="link === undefined ? 'div' : UiCard" v-if="!isEmptyReport(report)" class="vdf-services-status">
    <UiTitle v-if="link !== undefined">
      {{ t('firewall:services') }}
      <template #action>
        <UiLink :to="link" size="medium">{{ t('firewall:services:manage') }}</UiLink>
      </template>
    </UiTitle>
    <!-- no service of a kind declared: today's trust in what comes from outside -->
    <UiInfo v-for="line of undeclared.lines" :key="line.kinds.join()" accent="warning" wrap>
      {{
        line.kinds.includes('router')
          ? t('firewall:services:undeclared:router', { hosts: list(line.hosts) })
          : t('firewall:services:undeclared:dhcp', {
              kind: list(line.kinds.map(dhcpVersion), 'disjunction'),
              hosts: list(line.hosts),
            })
      }}
    </UiInfo>
    <UiInfo v-if="undeclared.pending.length > 0" accent="info" wrap>
      {{
        t('firewall:services:undeclared:pending', {
          kinds: list(undeclared.pending.map(kind => t(`firewall:service:kind:${kind}`))),
        })
      }}
    </UiInfo>
    <UiInfo v-for="item of report.unenforced" :key="`${item.host}|${item.bridge}`" accent="warning" wrap>
      {{ t('firewall:services:unenforced', { host: item.host, bridge: item.bridge }) }}
    </UiInfo>
    <UiInfo v-for="item of report.notes" :key="`${item.host}|${item.text}`" accent="info" wrap>
      {{ t('firewall:in-host', { host: item.host, text: item.text }) }}
    </UiInfo>
    <!-- the sources the hosts sampled: candidates to declare -->
    <template v-if="report.seen.length > 0">
      <span class="typo-body-bold-small">{{ t('firewall:services:seen') }}</span>
      <div v-for="item of report.seen" :key="`${item.kind}|${item.src}`" class="seen typo-body-regular-small">
        <span>
          {{
            t('firewall:services:seen:entry', {
              kind: t(`firewall:service:kind:${item.kind}`),
              src: item.src,
              n: item.count,
              hosts: list(item.hosts),
            })
          }}
          <VtsRelativeTime :date="item.last" />
        </span>
        <UiButton
          v-if="declarable"
          variant="tertiary"
          accent="brand"
          size="small"
          left-icon="fa:plus"
          @click="emit('declare', item.kind, item.src)"
        >
          {{ t('firewall:services:declare') }}
        </UiButton>
      </div>
    </template>
  </component>
</template>

<script lang="ts" setup>
import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { VdfServiceKind } from '@/modules/vdf/types.ts'
import { dhcpVersion, isEmptyReport, servicesReport, undeclaredLines } from '@/modules/vdf/utils/vdf-services.util.ts'
import { parseHostStatus } from '@/modules/vdf/utils/vdf-status.util.ts'
import VtsRelativeTime from '@core/components/relative-time/VtsRelativeTime.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'

// What the pool's agents say of the infrastructure services (vdf#103):
// kinds no service declares, bridges where forged MACs aren't dropped,
// notes, and the undeclared sources they sampled (candidates to declare)
const {
  poolId,
  declarable = false,
  drafted = [],
} = defineProps<{
  poolId: string
  // the kinds the draft declares: no longer undeclared once published
  drafted?: VdfServiceKind[]
  // offers "Declare" on each sampled source
  declarable?: boolean
  // a card of its own, linking to where services are declared (overview)
  link?: RouteLocationRaw
}>()

const emit = defineEmits<{
  declare: [kind: VdfServiceKind, src: string]
}>()

const { t, locale } = useI18n()

const { hosts } = useXoHostCollection()

const report = computed(() =>
  servicesReport(
    hosts.value
      .filter(host => host.$pool === poolId)
      .map(host => ({ name: host.name_label, services: parseHostStatus(host.otherConfig)?.services }))
  )
)

const undeclared = computed(() => undeclaredLines(report.value.undeclared, drafted))

const list = (items: string[], type: Intl.ListFormatType = 'conjunction') =>
  new Intl.ListFormat(locale.value, { type }).format(items)
</script>

<style lang="postcss" scoped>
.vdf-services-status {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  .seen {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem 0.8rem;
  }
}
</style>
