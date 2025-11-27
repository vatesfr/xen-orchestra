<template>
  <UiHeadBar icon="fa:gear">{{ t('settings') }}</UiHeadBar>
  <UiCard class="settings">
    <!-- ABOUT -->
    <div class="container">
      <UiTitle>{{ t('about') }}</UiTitle>
      <VtsColumns class="columns" :class="{ 'mobile-about': uiStore.isMobile }">
        <VtsQuickInfoColumn>
          <div class="typo-h6">{{ t('xen-orchestra') }}</div>
          <VtsQuickInfoRow :label="t('version')" />
          <VtsQuickInfoRow :label="t('news')">
            <template #value>
              <UiLink size="medium" :href="XO_LINKS.BLOG">
                {{ t('news-name', { name: t('xen-orchestra') }) }}
              </UiLink>
            </template>
          </VtsQuickInfoRow>
          <VtsQuickInfoRow :label="t('community')">
            <template #value>
              <UiLink size="medium" :href="XO_LINKS.COMMUNITY">
                {{ t('community-name', { name: t('xen-orchestra') }) }}
              </UiLink>
            </template>
          </VtsQuickInfoRow>
          <VtsQuickInfoRow :label="t('documentation')">
            <template #value>
              <UiLink size="medium" :href="XO_LINKS.DOC">
                {{ t('documentation-name', { name: t('xen-orchestra') }) }}
              </UiLink>
            </template>
          </VtsQuickInfoRow>
        </VtsQuickInfoColumn>
        <VtsQuickInfoColumn>
          <div class="typo-h6">{{ t('xcp-ng') }}</div>
          <VtsQuickInfoColumn>
            <VtsQuickInfoRow :label="t('news')">
              <template #value>
                <UiLink size="medium" :href="XCP_LINKS.BLOG">
                  {{ t('news-name', { name: t('xcp-ng') }) }}
                </UiLink>
              </template>
            </VtsQuickInfoRow>
            <VtsQuickInfoRow :label="t('community')">
              <template #value>
                <UiLink size="medium" :href="XCP_LINKS.COMMUNITY">
                  {{ t('community-name', { name: t('xcp-ng') }) }}
                </UiLink>
              </template>
            </VtsQuickInfoRow>
            <VtsQuickInfoRow :label="t('documentation')">
              <template #value>
                <UiLink size="medium" :href="XCP_LINKS.DOC">
                  {{ t('documentation-name', { name: t('xcp-ng') }) }}
                </UiLink>
              </template>
            </VtsQuickInfoRow>
            <VtsQuickInfoRow :label="t('support')">
              <template #value>
                <UiLink size="medium" :href="XCP_LINKS.SUPPORT">
                  {{ t('pro-support', { name: t('xcp-ng') }) }}
                </UiLink>
              </template>
            </VtsQuickInfoRow>
          </VtsQuickInfoColumn>
        </VtsQuickInfoColumn>
      </VtsColumns>
    </div>
    <!-- APPEARANCE -->
    <div class="container">
      <UiTitle>{{ t('appearance') }}</UiTitle>
      <VtsColumns>
        <div class="typo-h6">{{ t('mode') }}</div>
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
              :alt="t('light-mode.enable')"
            />
            <img
              v-else-if="colorModeOption === 'dark'"
              src="../assets/color-mode-dark.svg"
              :alt="t('dark-mode.enable')"
            />
            <img v-else src="../assets/color-mode-auto.svg" :alt="t('color-mode.auto')" />
            <span>
              <VtsIcon v-if="uiStore.colorMode === colorModeOption" name="fa:check" size="medium" />
              {{ t(`theme-${colorModeOption}`) }}
            </span>
          </div>
        </div>
      </VtsColumns>
    </div>
    <!-- LANGUAGE -->
    <div class="container">
      <UiTitle>{{ t('language-preferences') }}</UiTitle>
      <VtsColumns class="columns" :class="{ 'mobile-language': uiStore.isMobile }">
        <VtsQuickInfoColumn class="language">
          <VtsInputWrapper :label="t('language')">
            <VtsSelect :id="localeSelectId" accent="brand" />
            <UiInfo accent="info" wrap>{{ t('untranslated-text-helper') }}</UiInfo>
          </VtsInputWrapper>
        </VtsQuickInfoColumn>
        <VtsQuickInfoColumn>
          <VtsQuickInfoRow :label="t('translation-tool')">
            <template #value>
              <UiLink size="medium" :href="XO_LINKS.TRANSLATION">
                {{ t('weblate') }}
              </UiLink>
            </template>
          </VtsQuickInfoRow>
        </VtsQuickInfoColumn>
      </VtsColumns>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { XCP_LINKS, XO_LINKS } from '@/constants.ts'
import VtsColumns from '@core/components/column/VtsColumn.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsQuickInfoColumn from '@core/components/quick-info-column/VtsQuickInfoColumn.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { locales } from '@core/i18n.ts'
import { useFormSelect } from '@core/packages/form-select'
import { useUiStore } from '@core/stores/ui.store.ts'
import { type BasicColorSchema } from '@vueuse/core'
import { useCookies } from '@vueuse/integrations/useCookies'
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale, availableLocales } = useI18n()

const cookies = useCookies(['lang'])

watch(locale, newLocale => cookies.set('lang', newLocale))

const colorModeOptions = ['light', 'dark', 'auto'] as BasicColorSchema[]

const uiStore = useUiStore()

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
  }

  .columns {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(25rem, 1fr));
    gap: 8rem;

    &.mobile-about {
      gap: 2.4rem;
    }
    &.mobile-language {
      gap: 4rem;
    }
  }

  .color-modes {
    display: flex;
    gap: 1.6rem;

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
    max-width: 40rem;
  }
}
</style>
