<template>
  <UiPanelCard class="traffic-rule-priority-card">
    <UiPanelCardTitle size="medium">
      <template #label>
        <I18nT class="title" keypath="priority-within" scope="global" tag="span">
          <template #name>
            <UiLink :to="networkTo" icon="object:network" size="small">
              {{ network.name_label }}
            </UiLink>
          </template>
        </I18nT>
      </template>
    </UiPanelCardTitle>

    <I18nT class="position typo-body-regular-small" keypath="traffic-rules:position-on-network" scope="global" tag="p">
      <template #position>
        <span class="typo-body-bold-small"
          >{{ position }}<sup>{{ ordinalSuffix }}</sup> {{ t('rule') }}</span
        >
      </template>
    </I18nT>

    <UiCollapsibleList :total-items="networkRules.length" tag="ul">
      <li
        v-for="(networkRule, index) of networkRules"
        :key="networkRule.id"
        :class="{ current: networkRule.id === rule.id }"
        class="rule typo-body-regular-small"
      >
        <span class="index typo-body-bold-small">{{ index + 1 }}</span>
        <UiTag :accent="networkRule.allow ? 'success' : 'danger'" variant="secondary">
          {{ networkRule.allow ? t('allow') : t('drop') }}
        </UiTag>
        <span class="typo-body-bold-small">{{ getProtocolLabel(networkRule) }}</span>
        <span>{{ networkRule.ipRange }}</span>
        <span v-if="networkRule.id === rule.id" class="this-rule typo-body-bold-small">{{ t('this-rule') }}</span>
      </li>
    </UiCollapsibleList>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { getPoolNetworkRoute } from '@/modules/network/utils/xo-network.util.ts'
import UiCollapsibleList from '@core/components/ui/collapsible-list/UiCollapsibleList.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import type { TrafficRule } from '@vates/types'
import { computed } from 'vue'
import { I18nT, useI18n } from 'vue-i18n'

const { rule, rules, network } = defineProps<{
  rule: TrafficRule
  rules: TrafficRule[]
  network: FrontXoNetwork
}>()

const { t, locale } = useI18n()

const networkTo = computed(() => getPoolNetworkRoute(network.$pool, network.id))

const networkRules = computed(() => rules.filter(networkRule => networkRule.networkId === rule.networkId))

const position = computed(() => networkRules.value.findIndex(networkRule => networkRule.id === rule.id) + 1)

const ordinalSuffix = computed(() => {
  const ordinalRules = new Intl.PluralRules(locale.value, { type: 'ordinal' })
  const category = ordinalRules.select(position.value)

  return t(`ordinal-suffix:${category}`)
})

function getProtocolLabel(networkRule: TrafficRule) {
  if (networkRule.port) {
    return `${networkRule.protocol}:${networkRule.port}`
  }

  return networkRule.protocol
}
</script>

<style lang="postcss" scoped>
.traffic-rule-priority-card {
  .title {
    display: inline-flex;
    align-items: center;
    gap: 1.6rem;
  }

  .position {
    color: var(--color-neutral-txt-secondary);
  }

  .rule {
    display: flex;
    align-items: center;
    gap: 1.2rem;
    margin-inline: -1.6rem;
    padding: 0.4rem 1.6rem;

    &.current {
      background-color: var(--color-brand-background-selected);
    }
  }

  .index {
    color: var(--color-brand-txt-base);
  }

  .this-rule {
    margin-inline-start: auto;
    text-align: right;
    color: var(--color-brand-txt-base);
  }
}
</style>
