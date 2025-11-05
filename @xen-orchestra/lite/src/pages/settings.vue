<template>
  <UiHeadBar icon="fa:gear">{{ t('settings') }}</UiHeadBar>
  <UiCard class="settings-page">
    <UiTitle>{{ t('about') }}</UiTitle>
    <VtsColumns class="about-columns">
      <VtsQuickInfoColumn>
        <div class="typo-h5">Xen Orchestra Lite</div>
        <VtsQuickInfoColumn>
          <VtsQuickInfoRow :label="t('version')">
            <template #value>
              {{ `v${xoLiteVersion}` }}
              <code v-if="xoLiteGitHead">{{ `(${xoLiteGitHead.slice(0, 5)})` }}</code>
            </template>
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
          <!-- #TODO we dont have ofical documentation for xo-lite -->
          <!--
 <VtsQuickInfoRow :label="t('documentation')">
            <template #value>
              <UiLink size="medium" href="https://github.com/vatesfr/xen-orchestra/tree/master/%40xen-orchestra/lite">
                {{ t('documentation-name', { name: 'XO Lite' }) }}
              </UiLink>
            </template>
          </VtsQuickInfoRow>
-->
        </VtsQuickInfoColumn>
      </VtsQuickInfoColumn>
      <VtsQuickInfoColumn>
        <div class="typo-h5">XCP-ng</div>
        <VtsQuickInfoColumn>
          <VtsQuickInfoRow :label="t('version')">
            <template #value>{{ `v${xcpVersion}` }}</template>
          </VtsQuickInfoRow>
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
                {{ t('professional-support') }}
              </UiLink>
            </template>
          </VtsQuickInfoRow>
        </VtsQuickInfoColumn>
      </VtsQuickInfoColumn>
    </VtsColumns>
    <UiTitle>{{ t('appearance') }}</UiTitle>
    <div class="options">
      <div
        v-for="colorModeOption in colorModeOptions"
        :key="colorModeOption"
        class="option"
        :class="{ selected: uiStore.colorMode === colorModeOption }"
        @click="uiStore.colorMode = colorModeOption"
      >
        <img v-if="colorModeOption === 'light'" src="../assets/color-mode-light.svg" :alt="t('dark-mode.disable')" />
        <img v-else-if="colorModeOption === 'dark'" src="../assets/color-mode-dark.svg" :alt="t('dark-mode.enable')" />
        <img v-else src="../assets/color-mode-auto.svg" :alt="t('dark-mode.auto')" />
        <span>
          <VtsIcon v-if="uiStore.colorMode === colorModeOption" name="fa:check" size="medium" />
          {{ t(`theme-${colorModeOption}`) }}
        </span>
      </div>
    </div>
    <UiTitle>{{ t('language') }}</UiTitle>
    <!-- for regular spacing using VtsQuickInfoRow even label template is not used for this -->
    <VtsQuickInfoRow>
      <template #label>
        <VtsSelect :id="localeSelectId" icon="fa:earth-americas" accent="brand" />
      </template>
      <template #value>
        <UiLink size="medium" href="https://translate.vates.tech/engage/xen-orchestra/">
          {{ t('settings.missing-translations') }}
        </UiLink>
      </template>
    </VtsQuickInfoRow>
    <UiInfo accent="info">{{ t('untranslated-text-helper') }}</UiInfo>
  </UiCard>
</template>

<script lang="ts" setup>
import { usePageTitleStore } from '@/stores/page-title.store.ts'
import { useHostStore } from '@/stores/xen-api/host.store.ts'
import { usePoolStore } from '@/stores/xen-api/pool.store.ts'
import VtsColumns from '@core/components/columns/VtsColumns.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
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
import type { BasicColorSchema } from '@vueuse/core'
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const xoLiteVersion = XO_LITE_VERSION
const xoLiteGitHead = XO_LITE_GIT_HEAD
const { t, locale, availableLocales } = useI18n()

usePageTitleStore().setTitle(() => t('settings'))

const { pool } = usePoolStore().subscribe()

const { getByOpaqueRef: getHost } = useHostStore().subscribe()

const poolMaster = computed(() => (pool.value ? getHost(pool.value.master) : undefined))
const xcpVersion = computed(() => poolMaster.value?.software_version.product_version)

watch(locale, newLocale => localStorage.setItem('lang', newLocale))

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
.settings-page {
  margin: 0.8rem;

  .about-columns {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(25rem, 1fr));
    gap: 2.4rem;
  }

  .options {
    display: flex;
    gap: 25px;

    .option {
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
}
</style>
