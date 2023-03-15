<template>
  <TitleBar :icon="faGear">{{ $t("settings") }}</TitleBar>
  <div class="card-view">
    <UiCard class="group">
      <UiCardTitle>Xen Orchestra Lite</UiCardTitle>
      <UiKeyValueList>
        <UiKeyValueRow>
          <template #key>{{ $t("version") }}</template>
          <template #value
            >v{{ version
            }}<code v-if="gitHead"> ({{ gitHead.slice(0, 5) }})</code></template
          >
        </UiKeyValueRow>
        <UiKeyValueRow>
          <template #key>{{ $t("news") }}</template>
          <template #value
            ><a
              target="_blank"
              rel="noopener noreferrer"
              href="https://xcp-ng.org/blog/"
              >{{ $t("news-name", { name: "XCP-ng" }) }}</a
            >
            -
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://xen-orchestra.com/blog/"
              >{{ $t("news-name", { name: "Xen Orchestra" }) }}</a
            ></template
          >
        </UiKeyValueRow>
        <UiKeyValueRow>
          <template #key>{{ $t("community") }}</template>
          <template #value
            ><a
              target="_blank"
              rel="noopener noreferrer"
              href="https://xcp-ng.org/forum"
              >{{ $t("community-name", { name: "XCP-ng" }) }}</a
            >
            -
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://xcp-ng.org/forum/category/12/xen-orchestra"
              >{{ $t("community-name", { name: "Xen Orchestra" }) }}</a
            ></template
          >
        </UiKeyValueRow>
      </UiKeyValueList>
    </UiCard>
    <UiCard class="group appearance">
      <UiCardTitle>{{ $t("appearance") }}</UiCardTitle>
      <div class="options">
        <div
          v-for="colorModeOption in colorModeOptions"
          :key="colorModeOption"
          class="option"
          :class="{ selected: colorMode === colorModeOption }"
          @click="colorMode = colorModeOption"
        >
          <img
            v-if="colorModeOption === 'light'"
            src="@/assets/color-mode-light.svg"
            alt="Color mode light"
          />
          <img
            v-else-if="colorModeOption === 'dark'"
            src="@/assets/color-mode-dark.svg"
            alt="Color mode dark"
          />
          <img
            v-else
            src="@/assets/color-mode-auto.svg"
            alt="Color mode auto"
          />
          <span>
            <UiIcon v-if="colorMode === colorModeOption" :icon="faCheck" />
            {{ $t(`theme-${colorModeOption}`) }}
          </span>
        </div>
      </div>
    </UiCard>
    <UiCard class="group">
      <UiCardTitle>{{ $t("language") }}</UiCardTitle>
      <UiKeyValueList>
        <UiKeyValueRow>
          <template #value>
            <FormWidget class="full-length" :before="faEarthAmericas">
              <select v-model="$i18n.locale">
                <option
                  :value="locale"
                  v-for="locale in $i18n.availableLocales"
                  :key="locale"
                >
                  {{ locales[locale].name ?? locale }}
                </option>
              </select>
            </FormWidget></template
          >
        </UiKeyValueRow>
      </UiKeyValueList>
    </UiCard>
  </div>
</template>

<script lang="ts" setup>
import UiCardTitle from "@/components/ui/UiCardTitle.vue";
import UiIcon from "@/components/ui/icon/UiIcon.vue";
import type { BasicColorSchema } from "@vueuse/core";
import { useUiStore } from "@/stores/ui.store";
import { storeToRefs } from "pinia";
import { watch } from "vue";
import { useI18n } from "vue-i18n";
import { locales } from "@/i18n";
import {
  faEarthAmericas,
  faGear,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import FormWidget from "@/components/FormWidget.vue";
import TitleBar from "@/components/TitleBar.vue";
import UiCard from "@/components/ui/UiCard.vue";
import UiKeyValueList from "@/components/ui/UiKeyValueList.vue";
import UiKeyValueRow from "@/components/ui/UiKeyValueRow.vue";

const version = XO_LITE_VERSION;
const gitHead = XO_LITE_GIT_HEAD;
const { locale } = useI18n();

watch(locale, (newLocale) => localStorage.setItem("lang", newLocale));

const colorModeOptions = ["light", "dark", "auto"] as BasicColorSchema[];
const { colorMode } = storeToRefs(useUiStore());
</script>

<style lang="postcss" scoped>
.card-view {
  flex-direction: column;
}

.appearance .options {
  display: flex;
  gap: 25px;
  .option {
    display: flex;
    flex-direction: column;
    gap: 1.6em;
    &.selected {
      color: var(--color-extra-blue-base);
      img {
        outline: solid 2px var(--color-extra-blue-base);
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

.full-length {
  width: 100%;
}
</style>
