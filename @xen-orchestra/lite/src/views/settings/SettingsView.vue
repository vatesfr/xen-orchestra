<template>
  <TitleBar :icon="faGear">{{ $t('settings') }}</TitleBar>
  <div class="card-view">
    <UiCard class="group about">
      <UiCardTitle>{{ $t('about') }}</UiCardTitle>
      <div class="sections">
        <div>
          <h5>Xen Orchestra Lite</h5>
          <UiKeyValueList>
            <UiKeyValueRow>
              <template #key>{{ $t('version') }}</template>
              <template #value>
                {{ `v${xoLiteVersion}` }}
                <code v-if="xoLiteGitHead">{{ `(${xoLiteGitHead.slice(0, 5)})` }}</code>
              </template>
            </UiKeyValueRow>
            <UiKeyValueRow>
              <template #key>{{ $t('news') }}</template>
              <template #value>
                <a target="_blank" rel="noopener noreferrer" href="https://xen-orchestra.com/blog/">
                  {{ $t('news-name', { name: 'Xen Orchestra' }) }}
                </a>
              </template>
            </UiKeyValueRow>
            <UiKeyValueRow>
              <template #key>{{ $t('community') }}</template>
              <template #value>
                <a target="_blank" rel="noopener noreferrer" href="https://xcp-ng.org/forum/category/12/xen-orchestra">
                  {{ $t('community-name', { name: 'Xen Orchestra' }) }}
                </a>
              </template>
            </UiKeyValueRow>
          </UiKeyValueList>
        </div>
        <div>
          <h5>XCP-ng</h5>
          <UiKeyValueList>
            <UiKeyValueRow>
              <template #key>{{ $t('version') }}</template>
              <template #value>{{ `v${xcpVersion}` }}</template>
            </UiKeyValueRow>
            <UiKeyValueRow>
              <template #key>{{ $t('news') }}</template>
              <template #value>
                <a target="_blank" rel="noopener noreferrer" href="https://xcp-ng.org/blog/">
                  {{ $t('news-name', { name: 'XCP-ng' }) }}
                </a>
              </template>
            </UiKeyValueRow>
            <UiKeyValueRow>
              <template #key>{{ $t('community') }}</template>
              <template #value>
                <a target="_blank" rel="noopener noreferrer" href="https://xcp-ng.org/forum">
                  {{ $t('community-name', { name: 'XCP-ng' }) }}
                </a>
              </template>
            </UiKeyValueRow>
            <UiKeyValueRow>
              <template #key>{{ $t('documentation') }}</template>
              <template #value>
                <a target="_blank" rel="noopener noreferrer" href="https://xcp-ng.org/docs/">
                  {{ $t('documentation-name', { name: 'XCP-ng' }) }}
                </a>
              </template>
            </UiKeyValueRow>
            <UiKeyValueRow>
              <template #key>{{ $t('support') }}</template>
              <template #value>
                <a target="_blank" rel="noopener noreferrer" href="https://xcp-ng.com/">
                  {{ $t('professional-support') }}
                </a>
              </template>
            </UiKeyValueRow>
          </UiKeyValueList>
        </div>
      </div>
    </UiCard>
    <UiCard class="group appearance">
      <UiCardTitle>{{ $t('appearance') }}</UiCardTitle>
      <div class="options">
        <div
          v-for="colorModeOption in colorModeOptions"
          :key="colorModeOption"
          class="option"
          :class="{ selected: colorMode === colorModeOption }"
          @click="colorMode = colorModeOption"
        >
          <img v-if="colorModeOption === 'light'" src="@/assets/color-mode-light.svg" :alt="$t('dark-mode.disable')" />
          <img
            v-else-if="colorModeOption === 'dark'"
            src="@/assets/color-mode-dark.svg"
            :alt="$t('dark-mode.enable')"
          />
          <img v-else src="@/assets/color-mode-auto.svg" :alt="$t('dark-mode.auto')" />
          <span>
            <UiIcon v-if="colorMode === colorModeOption" :icon="faCheck" />
            {{ $t(`theme-${colorModeOption}`) }}
          </span>
        </div>
      </div>
    </UiCard>
    <UiCard class="group">
      <UiCardTitle>{{ $t('language') }}</UiCardTitle>
      <FormSelect v-model="$i18n.locale" :before="faEarthAmericas">
        <option v-for="availableLocale in $i18n.availableLocales" :key="availableLocale" :value="availableLocale">
          {{ locales[availableLocale].name ?? availableLocale }}
        </option>
      </FormSelect>
    </UiCard>
  </div>
</template>

<script lang="ts" setup>
import FormSelect from '@/components/form/FormSelect.vue'
import TitleBar from '@/components/TitleBar.vue'
import UiIcon from '@/components/ui/icon/UiIcon.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiCardTitle from '@/components/ui/UiCardTitle.vue'
import UiKeyValueList from '@/components/ui/UiKeyValueList.vue'
import UiKeyValueRow from '@/components/ui/UiKeyValueRow.vue'
import { usePageTitleStore } from '@/stores/page-title.store'
import { useHostStore } from '@/stores/xen-api/host.store'
import { usePoolStore } from '@/stores/xen-api/pool.store'
import { locales } from '@core/i18n'
import { useUiStore } from '@core/stores/ui.store'
import { faEarthAmericas, faGear, faCheck } from '@fortawesome/free-solid-svg-icons'
import type { BasicColorSchema } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const xoLiteVersion = XO_LITE_VERSION
const xoLiteGitHead = XO_LITE_GIT_HEAD
const { t, locale } = useI18n()

usePageTitleStore().setTitle(() => t('settings'))

const { pool } = usePoolStore().subscribe()

const { getByOpaqueRef: getHost } = useHostStore().subscribe()

const poolMaster = computed(() => (pool.value ? getHost(pool.value.master) : undefined))
const xcpVersion = computed(() => poolMaster.value?.software_version.product_version)

watch(locale, newLocale => localStorage.setItem('lang', newLocale))

const colorModeOptions = ['light', 'dark', 'auto'] as BasicColorSchema[]
const { colorMode } = storeToRefs(useUiStore())
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
</style>
