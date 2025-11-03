<template>
  <UiHeadBar icon="fa:gear">{{ t('settings') }}</UiHeadBar>
  <UiCard class="settings">
    <UiTitle>{{ t('about') }}</UiTitle>
    <VtsColumns class="columns">
      <VtsQuickInfoColumn>
        <div class="typo-h6">{{ t('xen-orchestra') }}</div>

        <VtsQuickInfoRow :label="t('version')">
          <template #value />
        </VtsQuickInfoRow>
        <VtsQuickInfoRow :label="t('news')">
          <template #value>
            <UiLink size="medium" href="https://xen-orchestra.com/blog/">
              {{ t('news-name', { name: 'Xen Orchestra' }) }}
            </UiLink>
          </template>
        </VtsQuickInfoRow>
        <VtsQuickInfoRow :label="t('community')">
          <template #value>
            <UiLink size="medium" href="https://xcp-ng.org/forum/category/12/xen-orchestra">
              {{ t('community-name', { name: 'Xen Orchestra' }) }}
            </UiLink>
          </template>
        </VtsQuickInfoRow>
        <VtsQuickInfoRow :label="t('documentation')">
          <template #value>
            <UiLink size="medium" href="https://docs.xen-orchestra.com">
              {{ t('documentation-name', { name: 'Xen Orchestra' }) }}
            </UiLink>
          </template>
        </VtsQuickInfoRow>
      </VtsQuickInfoColumn>
      <VtsQuickInfoColumn>
        <div class="typo-h6">{{ t('xcp-ng') }}</div>
        <VtsQuickInfoColumn>
          <VtsQuickInfoRow :label="t('news')">
            <template #value>
              <UiLink size="medium" href="https://xcp-ng.org/blog/">
                {{ t('news-name', { name: 'XCP-ng' }) }}
              </UiLink>
            </template>
          </VtsQuickInfoRow>
          <VtsQuickInfoRow :label="t('community')">
            <template #value>
              <UiLink size="medium" href="https://xcp-ng.org/forum">
                {{ t('community-name', { name: 'XCP-ng' }) }}
              </UiLink>
            </template>
          </VtsQuickInfoRow>
          <VtsQuickInfoRow :label="t('documentation')">
            <template #value>
              <UiLink size="medium" href="https://xcp-ng.org/docs/">
                {{ t('documentation-name', { name: 'XCP-ng' }) }}
              </UiLink>
            </template>
          </VtsQuickInfoRow>
          <VtsQuickInfoRow :label="t('support')">
            <template #value>
              <UiLink size="medium" href="https://xcp-ng.com/">
                {{ t('pro-support', { name: 'XCP-ng' }) }}
              </UiLink>
            </template>
          </VtsQuickInfoRow>
        </VtsQuickInfoColumn>
      </VtsQuickInfoColumn>
    </VtsColumns>

    <UiTitle>{{ t('appearance') }}</UiTitle>
    <VtsColumns>
      <div class="typo-h6">{{ t('mode') }}</div>
      <div class="color-modes">
        <div
          v-for="colorModeOption in colorModeOptions"
          :key="colorModeOption"
          class="color-mode"
          :class="{ selected: uiStore.colorMode === colorModeOption }"
          @click="uiStore.colorMode = colorModeOption"
        >
          <img v-if="colorModeOption === 'light'" src="../assets/color-mode-light.svg" :alt="t('dark-mode.disable')" />
          <img
            v-else-if="colorModeOption === 'dark'"
            src="../assets/color-mode-dark.svg"
            :alt="t('dark-mode.enable')"
          />
          <img v-else src="../assets/color-mode-auto.svg" :alt="t('dark-mode.auto')" />
          <span>
            <VtsIcon v-if="uiStore.colorMode === colorModeOption" name="fa:check" size="medium" />
            {{ t(`theme-${colorModeOption}`) }}
          </span>
        </div>
      </div>
    </VtsColumns>

    <UiTitle>{{ t('language-preferences') }}</UiTitle>
    <VtsColumns class="columns">
      <VtsQuickInfoColumn class="language">
        <UiLabel v-if="showLabel && !uiStore.isMobile" accent="neutral"> {{ t('language') }} </UiLabel>
        <VtsSelect :id="localeSelectId" accent="brand" />
        <UiInfo accent="info" wrap>{{ t('untranslated-text-helper') }}</UiInfo>
      </VtsQuickInfoColumn>
      <VtsQuickInfoColumn>
        <VtsQuickInfoRow :label="t('translation-tool')">
          <template #value>
            <UiLink size="medium" href="https://translate.vates.tech/engage/xen-orchestra/">
              {{ t('weblate') }}
            </UiLink>
          </template>
        </VtsQuickInfoRow>
      </VtsQuickInfoColumn>
    </VtsColumns>
  </UiCard>
</template>

<script setup lang="ts">
import VtsColumns from '@core/components/column/VtsColumn.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsQuickInfoColumn from '@core/components/quick-info-column/VtsQuickInfoColumn.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLabel from '@core/components/ui/label/UiLabel.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { locales } from '@core/i18n.ts'
import { useFormSelect } from '@core/packages/form-select'
import { useUiStore } from '@core/stores/ui.store.ts'
import type { BasicColorSchema } from '@vueuse/core'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale, availableLocales } = useI18n()

const { id: localeSelectId, selectedLabel: language } = useFormSelect(availableLocales, {
  model: locale,
  option: {
    label: locale => locales[locale]?.name ?? locale,
  },
})

const colorModeOptions = ['light', 'dark', 'auto'] as BasicColorSchema[]

const uiStore = useUiStore()

const showLabel = ref(true)

const initialLanguage = language.value

watch(locale, newLocale => localStorage.setItem('lang', newLocale))

watch(language, newLanguage => {
  if (!newLanguage) {
    return
  }

  if (newLanguage !== initialLanguage) {
    showLabel.value = false
  }
})
</script>

<style lang="postcss" scoped>
.settings {
  margin: 0.8rem;

  .columns {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(25rem, 1fr));
    gap: 8rem;
    margin-block-end: 2.4rem;
    align-items: baseline;
  }

  .color-modes {
    display: flex;
    gap: 1.6rem;
    margin-block-end: 2.4rem;

    .color-mode {
      display: flex;
      flex-direction: column;
      gap: 1.6em;

      &.selected {
        color: var(--color-brand-txt-base);

        img {
          outline: solid 2px var(--color-brand-txt-base);
        }
      }

      &:not(.selected) {
        cursor: pointer;
      }

      img {
        box-shadow: var(--shadow-100);
        border-radius: 8px;
      }
    }
  }

  .language {
    gap: 0.4rem;
    max-width: 40rem;
  }
}
</style>
