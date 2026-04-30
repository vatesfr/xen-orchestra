<template>
  <UiHeadBar icon="fa:gear">{{ t('settings') }}</UiHeadBar>
  <UiCard class="settings">
    <!-- ABOUT -->
    <div class="container">
      <UiTitle>{{ t('about') }}</UiTitle>
      <VtsColumns>
        <VtsColumn :class="{ 'mobile-about': uiStore.isSmall }">
          <div class="typo-h6">{{ t('xen-orchestra') }}</div>
          <VtsTabularKeyValueList>
            <VtsTabularKeyValueRow :label="t('version')" />
            <VtsTabularKeyValueRow :label="t('news')">
              <template #value>
                <UiLink size="medium" :href="XO_LINKS.BLOG">
                  {{ t('news-name', { name: t('xen-orchestra') }) }}
                </UiLink>
              </template>
            </VtsTabularKeyValueRow>
            <VtsTabularKeyValueRow :label="t('community')">
              <template #value>
                <UiLink size="medium" :href="XO_LINKS.COMMUNITY">
                  {{ t('community-name', { name: t('xen-orchestra') }) }}
                </UiLink>
              </template>
            </VtsTabularKeyValueRow>
            <VtsTabularKeyValueRow :label="t('documentation')">
              <template #value>
                <UiLink size="medium" :href="XO_LINKS.DOC">
                  {{ t('documentation-name', { name: t('xen-orchestra') }) }}
                </UiLink>
              </template>
            </VtsTabularKeyValueRow>
          </VtsTabularKeyValueList>
        </VtsColumn>
        <VtsColumn>
          <div class="typo-h6">{{ t('xcp-ng') }}</div>
          <VtsTabularKeyValueList>
            <VtsTabularKeyValueRow :label="t('news')">
              <template #value>
                <UiLink size="medium" :href="XCP_LINKS.BLOG">
                  {{ t('news-name', { name: t('xcp-ng') }) }}
                </UiLink>
              </template>
            </VtsTabularKeyValueRow>
            <VtsTabularKeyValueRow :label="t('community')">
              <template #value>
                <UiLink size="medium" :href="XCP_LINKS.COMMUNITY">
                  {{ t('community-name', { name: t('xcp-ng') }) }}
                </UiLink>
              </template>
            </VtsTabularKeyValueRow>
            <VtsTabularKeyValueRow :label="t('documentation')">
              <template #value>
                <UiLink size="medium" :href="XCP_LINKS.DOC">
                  {{ t('documentation-name', { name: t('xcp-ng') }) }}
                </UiLink>
              </template>
            </VtsTabularKeyValueRow>
            <VtsTabularKeyValueRow :label="t('support')">
              <template #value>
                <UiLink size="medium" :href="XCP_LINKS.SUPPORT">
                  {{ t('pro-support', { name: t('xcp-ng') }) }}
                </UiLink>
              </template>
            </VtsTabularKeyValueRow>
          </VtsTabularKeyValueList>
        </VtsColumn>
      </VtsColumns>
    </div>
    <!-- APPEARANCE -->
    <div class="container">
      <UiTitle>{{ t('appearance') }}</UiTitle>
      <div>
        <div class="typo-h6 title">{{ t('mode') }}</div>
        <!-- TODO replace this part when the component is available -->
        <div class="color-modes">
          <div
            v-for="colorModeOption in colorModeOptions"
            :key="colorModeOption"
            class="color-mode"
            :class="{ selected: uiStore.colorMode === colorModeOption }"
            @click="uiStore.colorMode = colorModeOption"
          >
            <img
              v-if="colorModeOption === 'light'"
              src="../assets/color-mode-light.svg"
              :alt="t('action:enable-light-mode')"
            />
            <img
              v-else-if="colorModeOption === 'dark'"
              src="../assets/color-mode-dark.svg"
              :alt="t('dark-mode:enable')"
            />
            <img v-else src="../assets/color-mode-auto.svg" :alt="t('color-mode:auto')" />
            <span>
              <VtsIcon v-if="uiStore.colorMode === colorModeOption" name="fa:check" size="medium" />
              {{ t(`theme-${colorModeOption}`) }}
            </span>
          </div>
        </div>
      </div>
      <div>
        <div class="typo-h6 title">{{ t('theme') }}</div>
        <div class="themes">
          <div
            v-for="theme in themes"
            :key="theme.id"
            class="theme-card"
            :class="{ selected: currentTheme === theme.id }"
            @click="currentTheme = theme.id"
          >
            <div class="theme-header">
              <VtsIcon v-if="currentTheme === theme.id" name="fa:circle-check" size="medium" />
              <div v-else class="circle" />
              <span class="typo-h6">{{ t(theme.label) }}</span>
            </div>
            <span class="typo-body-regular-small theme-description">{{ t(theme.description) }}</span>
          </div>
        </div>
      </div>
    </div>
    <!-- LANGUAGE -->
    <div class="container">
      <UiTitle>{{ t('language-preferences') }}</UiTitle>
      <VtsColumns>
        <VtsColumn :class="{ 'mobile-language': uiStore.isSmall }">
          <div class="language">
            <VtsInputWrapper :label="t('language')">
              <VtsSelect :id="localeSelectId" accent="brand" />
              <UiInfo accent="info" wrap>{{ t('untranslated-text-helper') }}</UiInfo>
            </VtsInputWrapper>
          </div>
        </VtsColumn>
        <VtsColumn>
          <VtsTabularKeyValueList>
            <VtsTabularKeyValueRow :label="t('translation-tool')">
              <template #value>
                <UiLink size="medium" :href="XO_LINKS.TRANSLATION">
                  {{ t('weblate') }}
                </UiLink>
              </template>
            </VtsTabularKeyValueRow>
          </VtsTabularKeyValueList>
        </VtsColumn>
      </VtsColumns>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { useTheme } from '@/shared/composables/theme.composable.ts'
import { XCP_LINKS, XO_LINKS } from '@/shared/constants.ts'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { locales } from '@core/i18n.ts'
import { useFormSelect } from '@core/packages/form-select'
import { useUiStore } from '@core/stores/ui.store.ts'
import type { BasicColorSchema } from '@vueuse/core'
import { useCookies } from '@vueuse/integrations/useCookies'
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale, availableLocales } = useI18n()

const cookies = useCookies(['lang'])

watch(locale, newLocale => {
  cookies.set('lang', newLocale)
  window.location.reload()
})

const colorModeOptions = ['light', 'dark', 'auto'] as BasicColorSchema[]

const uiStore = useUiStore()

const { currentTheme, themes } = useTheme()

const { id: localeSelectId } = useFormSelect(availableLocales, {
  model: locale,
  option: {
    label: locale => locales[locale]?.name ?? locale,
  },
})
</script>

<style lang="postcss" scoped>
.settings {
  margin: 0.8rem;
  gap: 4rem;

  .container {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;

    .title {
      margin-block-end: 0.8rem;
    }
  }

  .color-modes {
    display: flex;
    gap: 1.6rem;

    .color-mode {
      display: flex;
      flex-direction: column;
      gap: 1.6rem;

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

  .themes {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
    gap: 1.6rem;

    .theme-card {
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
      padding: 1.6rem;
      border: 0.1rem solid var(--color-neutral-border);
      border-radius: 0.8rem;
      background: var(--color-neutral-background-secondary);

      &.selected {
        border-color: var(--color-brand-txt-base);
        background: var(--color-brand-background-selected);

        .theme-header {
          color: var(--color-brand-txt-base);
        }
      }

      &:not(.selected) {
        cursor: pointer;

        &:hover {
          border-color: var(--color-brand-txt-base);
        }
      }

      .theme-header {
        display: flex;
        align-items: center;
        gap: 0.8rem;

        .circle {
          width: 1.6rem;
          height: 1.6rem;
          border-radius: 50%;
          background-color: var(--color-neutral-background-primary);
          border: 0.1rem solid var(--color-neutral-txt-secondary);
          flex-shrink: 0;
        }
      }

      .theme-description {
        color: var(--color-neutral-txt-secondary);
      }
    }
  }

  .language {
    max-width: 40rem;
  }
}
</style>
