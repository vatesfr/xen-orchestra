<template>
  <div class="sr-dashboard-view">
    
    <UiCard class="group about">
      <UiCardTitle>{{ $t("general") }}</UiCardTitle>
      <div class="sections">
        <div>
          <UiKeyValueList>
            <UiKeyValueRow>
              <template #key>{{ $t("name") }}</template>
              <template #value>{{ currentSr.name_label }}</template>
            </UiKeyValueRow>
            <UiKeyValueRow>
              <template #key>{{ $t("description") }}</template>
              <template #value>{{ currentSr.name_description }}</template>
            </UiKeyValueRow>
          </UiKeyValueList>
        </div>
        <div>
          <UiKeyValueList>
            <UiKeyValueRow>
              <template #key>{{ $t("type") }}</template>
              <template #value>{{ currentSr.type }}</template>
            </UiKeyValueRow>
            <UiKeyValueRow>
              <template #key>{{ $t("size") }}</template>
              <template #value>{{ formatSize(currentSr.physical_size) }}</template>
            </UiKeyValueRow>
            <UiKeyValueRow>
              <template #key>{{ $t("shared") }}</template>
              <template #value>{{ currentSr.shared }}</template>
            </UiKeyValueRow>
            <UiKeyValueRow>
              <template #key>{{ $t("uuid") }}</template>
              <template #value>{{ currentSr.uuid }}</template>
            </UiKeyValueRow>
          </UiKeyValueList>
        </div>
      </div>
    </UiCard>
    <UiCardGroup>
      <SrDashboardStorageUsage />
    </UiCardGroup>
  </div>
</template>

<script lang="ts" setup>
import SrDashboardStorageUsage from "@/components/sr/dashboard/SrDashboardStorageUsage.vue"; 
import UiCardGroup from "@/components/ui/UiCardGroup.vue";
import { usePageTitleStore } from "@/stores/page-title.store";
import { useI18n } from "vue-i18n";
import UiCard from "@/components/ui/UiCard.vue";
import UiKeyValueList from "@/components/ui/UiKeyValueList.vue";
import UiKeyValueRow from "@/components/ui/UiKeyValueRow.vue";
import UiCardTitle from "@/components/ui/UiCardTitle.vue";
import { useSrCollection } from "@/stores/xen-api/sr.store";
import { computed, watchEffect } from "vue";
import { useRoute } from "vue-router";
import type { XenApiSr } from "@/libs/xen-api/xen-api.types";
import { formatSize, percent } from "@/libs/utils";

  


usePageTitleStore().setTitle(useI18n().t("dashboard"));

const route = useRoute();
const { getByUuid } = useSrCollection();

const currentSr = computed(() =>
    getByUuid(route.params.uuid as XenApiSr["uuid"]) as XenApiSr
  );

</script>

<style lang="postcss" scoped>
.sr-dashboard-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
}

@media (min-width: 768px) {
  .sr-dashboard-view {
    column-count: 2;
  }
}

@media (min-width: 1500px) {
  .sr-dashboard-view {
    column-count: 3;
  }
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

</style><template>
  <div class="sr-dashboard-view">
    
    <UiCard class="group about">
      <UiCardTitle>{{ $t("details") }}</UiCardTitle>
      <div class="sections">
        <div>
          <UiKeyValueList>
            <UiKeyValueRow>
              <template #key>{{ $t("name") }}</template>
              <template #value>{{ currentSr.name_label }}</template>
            </UiKeyValueRow>
            <UiKeyValueRow>
              <template #key>{{ $t("description") }}</template>
              <template #value>{{ currentSr.name_description }}</template>
            </UiKeyValueRow>
          </UiKeyValueList>
        </div>
        <div>
          <UiKeyValueList>
            <UiKeyValueRow>
              <template #key>{{ $t("type") }}</template>
              <template #value>{{ currentSr.type }}</template>
            </UiKeyValueRow>
            <UiKeyValueRow>
              <template #key>{{ $t("size") }}</template>
              <template #value>{{ formatSize(currentSr.physical_size) }}</template>
            </UiKeyValueRow>
            <UiKeyValueRow>
              <template #key>{{ $t("shared") }}</template>
              <template #value>{{ currentSr.shared }}</template>
            </UiKeyValueRow>
            <UiKeyValueRow>
              <template #key>{{ $t("uuid") }}</template>
              <template #value>{{ currentSr.uuid }}</template>
            </UiKeyValueRow>
          </UiKeyValueList>
        </div>
      </div>
    </UiCard>
    <UiCardGroup>
      <SrDashboardStorageUsage />
    </UiCardGroup>
  </div>
</template>

<script lang="ts" setup>
import SrDashboardStorageUsage from "@/components/sr/dashboard/SrDashboardStorageUsage.vue"; 
import UiCardGroup from "@/components/ui/UiCardGroup.vue";
import { usePageTitleStore } from "@/stores/page-title.store";
import { useI18n } from "vue-i18n";
import UiCard from "@/components/ui/UiCard.vue";
import UiKeyValueList from "@/components/ui/UiKeyValueList.vue";
import UiKeyValueRow from "@/components/ui/UiKeyValueRow.vue";
import UiCardTitle from "@/components/ui/UiCardTitle.vue";
import { useSrCollection } from "@/stores/xen-api/sr.store";
import { computed, watchEffect } from "vue";
import { useRoute } from "vue-router";
import type { XenApiSr } from "@/libs/xen-api/xen-api.types";
import { formatSize, percent } from "@/libs/utils";

  


usePageTitleStore().setTitle(useI18n().t("dashboard"));

const route = useRoute();
const { getByUuid } = useSrCollection();

const currentSr = computed(() =>
    getByUuid(route.params.uuid as XenApiSr["uuid"]) as XenApiSr
  );

</script>

<style lang="postcss" scoped>
.sr-dashboard-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
}

@media (min-width: 768px) {
  .sr-dashboard-view {
    column-count: 2;
  }
}

@media (min-width: 1500px) {
  .sr-dashboard-view {
    column-count: 3;
  }
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

</style>