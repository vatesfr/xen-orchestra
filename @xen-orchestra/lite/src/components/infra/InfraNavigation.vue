<template>
    <UiTabBar>
      <UiTab :active="currentNavigationTab == NAV_TAB.VMS" @click.prevent="currentNavigationTab = NAV_TAB.VMS">
        <UiIcon :icon="faDisplay" class="icon" />
        <div ref="textElement" class="text">
          {{ $t("vms") }}
        </div>
      </UiTab>
      <UiTab :active="currentNavigationTab == NAV_TAB.STORAGES" @click.prevent="currentNavigationTab = NAV_TAB.STORAGES">
        <UiIcon :icon="faHdd" class="icon" />
        <div ref="textElement" class="text">
          {{ $t("storages") }}
        </div>
      </UiTab>
      <UiTab :active="currentNavigationTab == NAV_TAB.NETWORKS" @click.prevent="currentNavigationTab = NAV_TAB.NETWORKS">
        <UiIcon :icon="faNetworkWired" class="icon" />
        <div ref="textElement" class="text">
          {{ $t("networks") }}
        </div>
      </UiTab>
    </UiTabBar>
    <InfraPoolList />
</template>

<script lang="ts" setup>
  import UiTabBar from "@/components/ui/UiTabBar.vue";
  import UiTab from "@/components/ui/UiTab.vue";
  import UiIcon from "@/components/ui/icon/UiIcon.vue";
  import InfraPoolList from "@/components/infra/InfraPoolList.vue";
  import { faDisplay, faHdd, faNetworkWired } from "@fortawesome/free-solid-svg-icons";
  import { NAV_TAB, useNavigationStore } from "@/stores/navigation.store";
  import { storeToRefs } from "pinia";

  const navigationStore = useNavigationStore();
  const { currentNavigationTab } = storeToRefs(navigationStore);

</script>

<style lang="postcss" scoped>
.icon {
  color: var(--color-extra-blue-base);
}

.text {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 1.6rem;
  padding-left: 0.3em;
}

</style>