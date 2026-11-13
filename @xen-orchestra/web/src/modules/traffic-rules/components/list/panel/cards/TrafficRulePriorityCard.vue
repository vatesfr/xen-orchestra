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
          >{{ rule.rank }}<sup v-if="ordinalSuffix">{{ ordinalSuffix }}</sup></span
        >
      </template>
    </I18nT>

    <ul class="rules">
      <li
        v-for="{ networkRule, protocolLabel } of visibleNetworkRuleItems"
        :key="networkRule.id"
        :class="{ current: networkRule.id === rule.id }"
        class="rule typo-body-regular-small"
      >
        <span class="index typo-body-bold-small">{{ networkRule.rank }}</span>
        <UiTag :accent="networkRule.allow ? 'success' : 'danger'" variant="secondary">
          {{ networkRule.allow ? t('allow') : t('drop') }}
        </UiTag>
        <span class="details">
          <span class="typo-body-bold-small">{{ protocolLabel }}</span>
          <span>{{ networkRule.ipRange }}</span>
        </span>
        <span v-if="networkRule.id === rule.id" class="this-rule typo-body-bold-small">{{ t('this-rule') }}</span>
      </li>
    </ul>

    <UiButton
      v-if="hasHiddenRules"
      accent="brand"
      class="toggle"
      size="small"
      variant="tertiary"
      @click="isExpanded = !isExpanded"
    >
      {{ isExpanded ? t('action:see-less') : t('action:see-all') }}
    </UiButton>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { getPoolNetworkRoute } from '@/modules/network/utils/xo-network.util.ts'
import type { RankedTrafficRule } from '@/modules/traffic-rules/types.ts'
import {
  getNetworkRules,
  getOrdinalSuffix,
  getTrafficRuleProtocolLabel,
} from '@/modules/traffic-rules/utils/xo-traffic-rule.util.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { FALLBACK_LOCALE } from '@core/i18n.ts'
import { computed, ref, watch } from 'vue'
import { I18nT, useI18n } from 'vue-i18n'

const { rule, rules, network } = defineProps<{
  rule: RankedTrafficRule
  rules: RankedTrafficRule[]
  network: FrontXoNetwork
}>()

const VISIBLE_RULES_COUNT = 5

const { t, te, locale } = useI18n()

const networkTo = computed(() => getPoolNetworkRoute(network.$pool, network.id))

const ordinalSuffix = computed(() => {
  const suffixesKey = 'traffic-rules:rule-ordinal-suffixes'

  let messageLocale = FALLBACK_LOCALE

  if (te('traffic-rules:position-on-network', locale.value)) {
    messageLocale = locale.value
  }

  if (!te(suffixesKey, messageLocale)) {
    return undefined
  }

  return getOrdinalSuffix(t(suffixesKey, {}, { locale: messageLocale }), messageLocale, rule.rank)
})

const networkRules = computed(() => getNetworkRules(rules, rule.networkId))

const networkRuleItems = computed(() =>
  networkRules.value.map(networkRule => ({
    networkRule,
    protocolLabel: getTrafficRuleProtocolLabel(networkRule),
  }))
)

const isExpanded = ref(false)

watch(
  () => rule.id,
  () => {
    isExpanded.value = false
  }
)

const hasHiddenRules = computed(() => networkRules.value.length > VISIBLE_RULES_COUNT)

const visibleNetworkRuleItems = computed(() => {
  if (isExpanded.value || !hasHiddenRules.value) {
    return networkRuleItems.value
  }

  const lastStart = networkRules.value.length - VISIBLE_RULES_COUNT
  const centeredStart = rule.rank - 1 - Math.floor(VISIBLE_RULES_COUNT / 2)
  const start = Math.min(Math.max(centeredStart, 0), lastStart)

  return networkRuleItems.value.slice(start, start + VISIBLE_RULES_COUNT)
})
</script>

<style lang="postcss" scoped>
.traffic-rule-priority-card {
  .title {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem 1.6rem;
  }

  .position {
    color: var(--color-neutral-txt-secondary);
  }

  .rules {
    container-type: inline-size;
    container-name: traffic-rule-priority-rules;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .rule {
    line-height: 1;
    display: flex;
    align-items: center;
    gap: 1.2rem;
    margin-inline: -1.6rem;
    padding: 0.4rem 1.6rem;

    &.current {
      background-color: var(--color-brand-background-selected);
    }

    @container traffic-rule-priority-rules (max-width: 30rem) {
      &.current {
        display: grid;
        grid-template-columns: auto auto 1fr;
        grid-template-areas:
          'index tag this-rule'
          '. details details';
        gap: 0.8rem 1.2rem;

        .details {
          grid-area: details;
        }

        .this-rule {
          grid-area: this-rule;
        }
      }
    }
  }

  .details {
    display: flex;
    align-items: center;
    gap: 1.2rem;
  }

  .index {
    color: var(--color-brand-txt-base);
  }

  .this-rule {
    margin-inline-start: auto;
    text-align: right;
    color: var(--color-brand-txt-base);
  }

  .toggle {
    align-self: start;
  }
}
</style>
