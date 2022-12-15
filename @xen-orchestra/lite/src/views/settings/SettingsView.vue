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
    <UiCard class="group">
      <UiCardTitle>{{ $t("display") }}</UiCardTitle>
      <UiKeyValueList>
        <UiKeyValueRow>
          <template #key>{{ $t("appearance") }}</template>
          <template #value>
            <FormLabel>
              <FormSelect v-model="colorMode">
                <option value="auto">{{ $t("theme-auto") }}</option>
                <option value="dark">{{ $t("theme-dark") }}</option>
                <option value="light">{{ $t("theme-light") }}</option>
              </FormSelect>
            </FormLabel>
          </template>
        </UiKeyValueRow>
      </UiKeyValueList>
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
import FormWidget from "@/components/FormWidget.vue";
import TitleBar from "@/components/TitleBar.vue";
import FormSelect from "@/components/form/FormSelect.vue";
import UiCard from "@/components/ui/UiCard.vue";
import UiCardTitle from "@/components/ui/UiCardTitle.vue";
import UiKeyValueList from "@/components/ui/UiKeyValueList.vue";
import UiKeyValueRow from "@/components/ui/UiKeyValueRow.vue";
import { locales } from "@/i18n";
import { useUiStore } from "@/stores/ui.store";
import { faEarthAmericas, faGear } from "@fortawesome/free-solid-svg-icons";
import { storeToRefs } from "pinia";
import { watch } from "vue";
import { useI18n } from "vue-i18n";

const version = XO_LITE_VERSION;
const gitHead = XO_LITE_GIT_HEAD;
const { locale } = useI18n();

watch(locale, (newLocale) => localStorage.setItem("lang", newLocale));

const { colorMode } = storeToRefs(useUiStore());
</script>

<style lang="postcss" scoped>
.card-view {
  flex-direction: column;
}

.full-length {
  width: 100%;
}
</style>
