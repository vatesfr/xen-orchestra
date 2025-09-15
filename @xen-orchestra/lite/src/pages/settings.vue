<template>
  <TitleBar icon="fa:floppy-disk">{{ t('settings') }}</TitleBar>
  <div class="card-view">
    <UiCard class="group about">
      <UiCardTitle>{{ t('about') }}</UiCardTitle>
      <div class="sections">
        <div>
          <h5>Xen Orchestra Lite</h5>
          <UiKeyValueList>
            <UiKeyValueRow>
              <template #key>{{ t('version') }}</template>
              <template #value>
                {{ `v${xoLiteVersion}` }}
                <code v-if="xoLiteGitHead">{{ `(${xoLiteGitHead.slice(0, 5)})` }}</code>
              </template>
            </UiKeyValueRow>
            <UiKeyValueRow>
              <template #key>{{ t('news') }}</template>
              <template #value>
                <a target="_blank" rel="noopener noreferrer" href="https://xen-orchestra.com/blog/">
                  {{ t('news-name', { name: 'Xen Orchestra' }) }}
                </a>
              </template>
            </UiKeyValueRow>
            <UiKeyValueRow>
              <template #key>{{ t('community') }}</template>
              <template #value>
                <a target="_blank" rel="noopener noreferrer" href="https://xcp-ng.org/forum/category/12/xen-orchestra">
                  {{ t('community-name', { name: 'Xen Orchestra' }) }}
                </a>
              </template>
            </UiKeyValueRow>
          </UiKeyValueList>
        </div>
        <div>
          <h5>XCP-ng</h5>
          <UiKeyValueList>
            <UiKeyValueRow>
              <template #key>{{ t('version') }}</template>
              <template #value>{{ `v${xcpVersion}` }}</template>
            </UiKeyValueRow>
            <UiKeyValueRow>
              <template #key>{{ t('news') }}</template>
              <template #value>
                <a target="_blank" rel="noopener noreferrer" href="https://xcp-ng.org/blog/">
                  {{ t('news-name', { name: 'XCP-ng' }) }}
                </a>
              </template>
            </UiKeyValueRow>
            <UiKeyValueRow>
              <template #key>{{ t('community') }}</template>
              <template #value>
                <a target="_blank" rel="noopener noreferrer" href="https://xcp-ng.org/forum">
                  {{ t('community-name', { name: 'XCP-ng' }) }}
                </a>
              </template>
            </UiKeyValueRow>
            <UiKeyValueRow>
              <template #key>{{ t('documentation') }}</template>
              <template #value>
                <a target="_blank" rel="noopener noreferrer" href="https://xcp-ng.org/docs/">
                  {{ t('documentation-name', { name: 'XCP-ng' }) }}
                </a>
              </template>
            </UiKeyValueRow>
            <UiKeyValueRow>
              <template #key>{{ t('support') }}</template>
              <template #value>
                <a target="_blank" rel="noopener noreferrer" href="https://xcp-ng.com/">
                  {{ t('professional-support') }}
                </a>
              </template>
            </UiKeyValueRow>
          </UiKeyValueList>
        </div>
      </div>
    </UiCard>
    <UiCard class="group appearance">
      <UiCardTitle>{{ t('appearance') }}</UiCardTitle>
      <div class="options">
        <div
          v-for="colorModeOption in colorModeOptions"
          :key="colorModeOption"
          class="option"
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
    </UiCard>
    <UiCard class="group">
      <UiCardTitle>{{ t('language') }}</UiCardTitle>
      <VtsColumns class="i18n-columns">
        <VtsColumn>
          <VtsSelect :id="localeSelectId" icon="fa:earth-americas" accent="brand" />
        </VtsColumn>
        <VtsColumn class="i18n-link-column" :size="2">
          <UiLink size="small" href="https://translate.vates.tech/engage/xen-orchestra/">
            {{ t('settings.missing-translations') }}
          </UiLink>
        </VtsColumn>
      </VtsColumns>
    </UiCard>
  </div>
</template>

<script lang="ts" setup>
import TitleBar from '@/components/TitleBar.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiCardTitle from '@/components/ui/UiCardTitle.vue'
import UiKeyValueList from '@/components/ui/UiKeyValueList.vue'
import UiKeyValueRow from '@/components/ui/UiKeyValueRow.vue'
import { usePageTitleStore } from '@/stores/page-title.store.ts'
import { useHostStore } from '@/stores/xen-api/host.store.ts'
import { usePoolStore } from '@/stores/xen-api/pool.store.ts'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
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
.card-view {
  flex-direction: column;
}

h5 {
  font-size: 1.6rem;
  font-weight: 700;
  margin-bottom: 0.7em;
}

.about .sections {
  display: flex;
  gap: 2em;

  div {
    flex-grow: 1;
  }

  @media (--mobile) {
    flex-direction: column;
  }
}

.appearance .options {
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

.i18n-columns {
  padding-inline: 0;
  gap: 2rem;

  .i18n-link-column {
    flex: 2;
    justify-content: center;
  }
}
</style>
