<template>
  <UiTabBar>
    <UiTab v-bind="tab(TAB.PROPS, propParams)">Props</UiTab>
    <UiTab class="event-tab" v-bind="tab(TAB.EVENTS, eventParams)">
      Events
      <UiCounter
        v-if="unreadEventsCount > 0"
        :value="unreadEventsCount"
        color="success"
      />
    </UiTab>
    <UiTab v-bind="tab(TAB.SLOTS, slotParams)">Slots</UiTab>
    <UiTab v-bind="tab(TAB.SETTINGS, settingParams)">Settings</UiTab>
    <AppMenu placement="bottom" shadow>
      <template #trigger="{ open, isOpen }">
        <UiTab
          :active="isOpen"
          :disabled="presets === undefined"
          class="preset-tab"
          @click="open"
        >
          <UiIcon :icon="faSliders" />
          Presets
        </UiTab>
      </template>
      <MenuItem
        v-for="(preset, label) in presets"
        :key="label"
        @click="applyPreset(preset)"
      >
        {{ label }}
      </MenuItem>
    </AppMenu>
  </UiTabBar>

  <div class="tabs">
    <UiCard v-if="selectedTab === TAB.NONE" class="tab-content">
      <i>No configuration defined</i>
    </UiCard>
    <UiCard v-else-if="selectedTab === TAB.PROPS" class="tab-content">
      <StoryPropParams
        v-model="propValues"
        :params="propParams"
        @reset="resetProps"
      />
    </UiCard>
    <div
      v-else-if="selectedTab === TAB.EVENTS"
      class="tab-content event-tab-content"
    >
      <UiCard>
        <StoryEventParams :params="eventParams" />
      </UiCard>
      <UiCard>
        <UiCardTitle>
          Logs
          <template #right>
            <UiButton
              v-if="eventsLog.length > 0"
              transparent
              @click="eventsLog = []"
            >
              Clear
            </UiButton>
          </template>
        </UiCardTitle>
        <div class="events-log">
          <CodeHighlight
            v-for="event in eventLogRows"
            :key="event.id"
            :code="event.args"
            class="event-log"
          />
        </div>
      </UiCard>
    </div>
    <UiCard v-else-if="selectedTab === TAB.SLOTS" class="tab-content">
      <StorySlotParams :params="slotParams" />
    </UiCard>
    <UiCard v-else-if="selectedTab === TAB.SETTINGS" class="tab-content">
      <StorySettingParams
        v-model="settingValues"
        :params="settingParams"
        @reset="resetSettings"
      />
    </UiCard>
    <UiCard class="tab-content story-result">
      <slot :properties="slotProperties" :settings="slotSettings" />
    </UiCard>
  </div>
  <UiCard v-if="documentation !== undefined" class="documentation">
    <AppMarkdown :content="documentation" />
  </UiCard>
</template>

<script lang="ts" setup>
import AppMarkdown from "@/components/AppMarkdown.vue";
import CodeHighlight from "@/components/CodeHighlight.vue";
import StoryEventParams from "@/components/component-story/StoryEventParams.vue";
import StoryPropParams from "@/components/component-story/StoryPropParams.vue";
import StorySettingParams from "@/components/component-story/StorySettingParams.vue";
import StorySlotParams from "@/components/component-story/StorySlotParams.vue";
import AppMenu from "@/components/menu/AppMenu.vue";
import MenuItem from "@/components/menu/MenuItem.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiCard from "@/components/ui/UiCard.vue";
import UiCardTitle from "@/components/ui/UiCardTitle.vue";
import UiCounter from "@/components/ui/UiCounter.vue";
import UiIcon from "@/components/ui/icon/UiIcon.vue";
import UiTab from "@/components/ui/UiTab.vue";
import UiTabBar from "@/components/ui/UiTabBar.vue";
import {
  isEventParam,
  isModelParam,
  isPropParam,
  isSettingParam,
  isSlotParam,
  ModelParam,
  type Param,
} from "@/libs/story/story-param";
import { faSliders } from "@fortawesome/free-solid-svg-icons";
import "highlight.js/styles/github-dark.css";
import { uniqueId, upperFirst } from "lodash-es";
import { computed, reactive, ref, watch, watchEffect } from "vue";
import { useRoute } from "vue-router";

const tab = (tab: TAB, params: Param[]) =>
  reactive({
    onClick: () => (selectedTab.value = tab),
    active: computed(() => selectedTab.value === tab),
    disabled: computed(() => params.length === 0),
  });

const props = defineProps<{
  params: (Param | ModelParam)[];
  presets?: Record<
    string,
    {
      props?: Record<string, any>;
      settings?: Record<string, any>;
    }
  >;
}>();

enum TAB {
  NONE,
  PROPS,
  EVENTS,
  SLOTS,
  SETTINGS,
}

const modelParams = computed(() => props.params.filter(isModelParam));

const propParams = computed(() => [
  ...props.params.filter(isPropParam),
  ...modelParams.value.map((modelParam) => modelParam.getPropParam()),
]);

const eventParams = computed(() => [
  ...props.params.filter(isEventParam),
  ...modelParams.value.map((modelParam) => modelParam.getEventParam()),
]);

const settingParams = computed(() => props.params.filter(isSettingParam));
const slotParams = computed(() => props.params.filter(isSlotParam));

const selectedTab = ref<TAB>(TAB.NONE);

if (propParams.value.length !== 0) {
  selectedTab.value = TAB.PROPS;
} else if (eventParams.value.length !== 0) {
  selectedTab.value = TAB.EVENTS;
} else if (slotParams.value.length !== 0) {
  selectedTab.value = TAB.SLOTS;
} else if (settingParams.value.length !== 0) {
  selectedTab.value = TAB.SETTINGS;
}

const propValues = reactive<Record<string, any>>({});
const settingValues = reactive<Record<string, any>>({});
const eventsLog = ref<
  { id: string; name: string; args: { name: string; value: any }[] }[]
>([]);
const unreadEventsCount = ref(0);

const resetProps = () => {
  propParams.value.forEach((param) => {
    propValues[param.name] = param.getPresetValue();
  });
};

const resetSettings = () => {
  settingParams.value.forEach((param) => {
    settingValues[param.name] = param.getPresetValue();
  });
};

watchEffect(() => {
  resetProps();
  resetSettings();
});

watch(selectedTab, (tab) => {
  if (tab === TAB.EVENTS) {
    unreadEventsCount.value = 0;
  }
});

const logEvent = (name: string, args: { name: string; value: any }[]) => {
  if (selectedTab.value !== TAB.EVENTS) {
    unreadEventsCount.value += 1;
  }

  eventsLog.value.unshift({
    id: uniqueId("event-log"),
    name,
    args,
  });
};

const eventLogRows = computed(() => {
  return eventsLog.value.map((eventLog) => {
    const args = eventLog.args
      .map((arg) => `${arg.name}: ${JSON.stringify(arg.value)}`)
      .join(", ");

    return {
      id: eventLog.id,
      name: eventLog.name,
      args: `${eventLog.name}(${args})`,
    };
  });
});

const slotProperties = computed(() => {
  const properties: Record<string, any> = {};

  propParams.value.forEach(({ name }) => {
    properties[name] = propValues[name];
  });

  eventParams.value.forEach((eventParam) => {
    properties[`on${upperFirst(eventParam.name)}`] = (...args: any[]) => {
      if (eventParam.isVModel()) {
        propValues[eventParam.rawName] = args[0];
      }
      const logArgs = Object.keys(eventParam.getArguments()).map(
        (argName, index) => ({
          name: argName,
          value: args[index],
        })
      );
      eventParam.getPresetValue()?.(...args);
      logEvent(eventParam.name, logArgs);
    };
  });

  return properties;
});

const slotSettings = computed(() => {
  const result: Record<string, any> = {};

  settingParams.value.forEach(({ name }) => {
    result[name] = settingValues[name];
  });

  return result;
});

const documentation = ref();

const route = useRoute();

const mdPaths = import.meta.glob("../../stories/*.md", { as: "raw" });

if (route.meta.storyMdPath !== undefined && route.meta.storyMdPath in mdPaths) {
  mdPaths[route.meta.storyMdPath]().then((md) => {
    documentation.value = md;
  });
}

const applyPreset = (preset: {
  props?: Record<string, any>;
  settings?: Record<string, any>;
}) => {
  if (preset.props !== undefined) {
    Object.entries(preset.props).forEach(([name, value]) => {
      propValues[name] = value;
    });
  }

  if (preset.settings !== undefined) {
    Object.entries(preset.settings).forEach(([name, value]) => {
      settingValues[name] = value;
    });
  }
};
</script>

<style lang="postcss" scoped>
.event-tab {
  gap: 0.5rem;
}

.preset-tab {
  margin-left: auto;
}

.event-tab-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.events-log {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.event-log {
  opacity: 0.5;

  &:first-child {
    opacity: 1;
  }
}

.tabs {
  display: flex;
  padding: 1rem;
  gap: 1rem;

  .tab-content {
    flex: 1;
    height: auto;
  }
}

.documentation {
  margin: 1rem;

  .ui-title {
    margin-bottom: 1rem;
  }
}
</style>
