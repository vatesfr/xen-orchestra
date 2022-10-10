<template>
  <TitleBar :icon="faGear">{{ $t("settings") }}</TitleBar>
  <div class="card-view">
    <UiCard class="group">
      <UiTitle type="h4">Xen Orchestra Lite</UiTitle>
      <UiKeyValueList>
        <UiKeyValueRow>
          <template #key>{{ $t("version") }}</template>
          <template #value
            >v{{ version
            }}<code v-if="gitHead"> ({{ gitHead.slice(0, 5) }})</code></template
          >
        </UiKeyValueRow>
        <UiKeyValueRow>
          <template #key>{{ $t("blog") }}</template>
          <template #value
            ><a
              target="_blank"
              rel="noopener noreferrer"
              href="https://xen-orchestra.com/blog/"
              >{{ $t("blog-name", { name: "Xen Orchestra" }) }}</a
            ></template
          >
        </UiKeyValueRow>
        <UiKeyValueRow>
          <template #key>{{ $t("forum") }}</template>
          <template #value
            ><a
              target="_blank"
              rel="noopener noreferrer"
              href="https://xcp-ng.org/forum/category/12/xen-orchestra"
              >{{ $t("forum-name", { name: "Xen Orchestra" }) }}</a
            ></template
          >
        </UiKeyValueRow>
      </UiKeyValueList>
    </UiCard>
    <UiCard class="group">
      <UiTitle type="h4">{{ $t("display") }}</UiTitle>
      <UiKeyValueList>
        <UiKeyValueRow>
          <template #key>{{ $t("appearance") }}</template>
          <template #value
            ><FormLabel>
              <FormToggle
                :modelValue="darkMode"
                @update:modelValue="setDarkMode"
                label="plop"
              />{{ $t("dark-mode") }}</FormLabel
            ></template
          >
        </UiKeyValueRow>
        <UiKeyValueRow>
          <template #key>{{ $t("language") }}</template>
          <template #value
            ><FormWidget :before="faEarthAmericas">
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
import { computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { locales } from "@/i18n";
import { faEarthAmericas, faGear } from "@fortawesome/free-solid-svg-icons";
import { useLocalStorage } from "@vueuse/core";
import FormWidget from "@/components/FormWidget.vue";
import TitleBar from "@/components/TitleBar.vue";
import FormLabel from "@/components/form/FormLabel.vue";
import FormToggle from "@/components/form/FormToggle.vue";
import UiCard from "@/components/ui/UiCard.vue";
import UiKeyValueList from "@/components/ui/UiKeyValueList.vue";
import UiKeyValueRow from "@/components/ui/UiKeyValueRow.vue";
import UiTitle from "@/components/ui/UiTitle.vue";

const version = XO_LITE_VERSION;
const gitHead = XO_LITE_GIT_HEAD;
const { locale } = useI18n();

watch(locale, (newLocale) => localStorage.setItem("lang", newLocale));

const colorMode = useLocalStorage<string>("colorMode", "dark");
const darkMode = computed(() => colorMode.value !== "light");
const setDarkMode = (enabled: boolean) => {
  colorMode.value = enabled ? "dark" : "light";
  document.documentElement.classList[enabled ? "add" : "remove"]("dark");
};
</script>

<style lang="postcss" scoped>
.card-view {
  flex-direction: column;
}

.group {
  min-width: 30em;
  overflow: auto;
}
</style>
