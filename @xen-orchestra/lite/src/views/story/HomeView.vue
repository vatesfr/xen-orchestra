<template>
  <div class="home-view">
    <UiTitle type="h4">
      This helper will generate a basic story component
    </UiTitle>
    <div>
      Choose a component:
      <select v-model="componentPath">
        <option value="" />
        <option v-for="(component, path) in componentsWithProps" :key="path">
          {{ path }}
        </option>
      </select>
      <div class="slots">
        <label>
          Slots names, separated by a comma
          <input v-model="slots" />
        </label>
        <button @click="slots = 'default'">Default</button>
        <button @click="slots = ''">Clear</button>
      </div>
    </div>
    <CodeHighlight v-if="componentPath" :code="template" />
  </div>
</template>

<script lang="ts" setup>
import CodeHighlight from "@/components/CodeHighlight.vue";
import UiTitle from "@/components/ui/UiTitle.vue";
import { type ComponentOptions, computed, ref, watch } from "vue";

const componentPath = ref("");

const components = import.meta.glob<{ default: ComponentOptions }>(
  "/src/components/**/*.vue",
  {
    eager: true,
  }
);

const componentsWithProps = Object.fromEntries(
  Object.entries(components).filter(
    ([, component]) => component.default.props || component.default.emits
  )
);

const lines = ref<string[]>([]);
const slots = ref("");

const quote = (str: string) => `'${str}'`;
const paramsToImport = ref(new Set<string>());
const widgetsToImport = ref(new Set<string>());

const template = computed(() => {
  const componentName = componentPath.value.replace(/.*\/([^/]+)\.vue$/, "$1");
  const path = componentPath.value.replace(/^\/src/, "@");
  const paramsLines = [...lines.value];
  const slotsNames = slots.value
    .split(",")
    .map((s) => s.trim())
    .filter((name) => name !== "");

  for (const slotName of slotsNames) {
    paramsLines.push(`slot(${slotName === "default" ? "" : quote(slotName)})`);
  }

  for (const slotName of slotsNames) {
    paramsLines.push(
      `setting(${quote(
        `${slotName}SlotContent`
      )}).preset('Example content for ${slotName} slot').widget(text()).help('Content for ${slotName} slot')`
    );
  }

  if (slotsNames.length > 0) {
    paramsToImport.value.add("slot").add("setting");
    widgetsToImport.value.add("text");
  }

  const paramsStr = paramsLines.join(",\n      ");

  return `<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      ${paramsStr}
    ]"
  >
    <${componentName} v-bind="properties"${
    slotsNames.length > 0
      ? `>\n      ${slotsNames
          .map((name) =>
            name === "default"
              ? `{{ settings.${name}SlotContent }}`
              : `<template #${name}>{{ settings.${name}SlotContent }}</template>`
          )
          .join("\n      ")}
    </${componentName}>`
      : ` />`
  }
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from "@/components/component-story/ComponentStory.vue";
import ${componentName} from "${path}";
${
  paramsToImport.value.size > 0
    ? `import { ${Array.from(paramsToImport.value.values()).join(
        ", "
      )} } from "@/libs/story/story-param"`
    : ""
}
${
  widgetsToImport.value.size > 0
    ? `import { ${Array.from(widgetsToImport.value.values()).join(
        ", "
      )} } from "@/libs/story/story-widget"`
    : ""
}
${"<"}/script>
`;
});

watch(
  componentPath,
  (path: string) => {
    if (!(path in components)) {
      return;
    }
    const component = components[path].default;

    slots.value = "";
    widgetsToImport.value = new Set();
    paramsToImport.value = new Set();
    lines.value = [];

    for (const propName in component.props) {
      const current = [];
      const prop = component.props[propName];

      if (prop.required) {
        current.push("required()");
      }

      if (prop.default) {
        current.push(`default(${quote(prop.default)})`);
      }

      if (prop.type) {
        const type = prop.type();

        current.push(
          `type(${quote(Array.isArray(type) ? "array" : typeof type)})`
        );
      }

      const isModel = component.emits?.includes(`update:${propName}`);
      paramsToImport.value.add(isModel ? "model" : "prop");

      current.unshift(
        `${isModel ? "model" : "prop"}(${
          propName === "modelValue" ? "" : quote(propName)
        })`
      );

      current.push("widget()");

      lines.value.push(current.join("."));
    }

    if (component.emits) {
      paramsToImport.value.add("event");
      for (const eventName of component.emits) {
        lines.value.push(`event("${eventName}")`);
      }
    }
  },
  { immediate: true }
);
</script>

<style lang="postcss" scoped>
.home-view {
  margin: 1rem;
}

.ui-title {
  margin-bottom: 1rem;
}

.slots {
  margin-top: 1rem;
}
</style>
