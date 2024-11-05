<template>
  <UiCard class="home-view">
    <UiCardTitle>Component Story skeleton generator</UiCardTitle>

    <div class="row">
      Choose a component
      <FormSelect v-model="componentPath">
        <option value="" />
        <option v-for="path in componentPaths" :key="path" :value="path">
          {{ pathToOptionLabel(path) }}
        </option>
      </FormSelect>
    </div>

    <div class="row">
      Slot names, separated by comma
      <span class="slots">
        <FormInput v-model="slots" />
        <UiButton size="medium" color="info" level="primary" @click="slots = 'default'">Default</UiButton>
        <UiButton size="medium" color="info" level="secondary" @click="slots = ''">Clear</UiButton>
      </span>
    </div>

    <p v-for="warning in warnings" :key="warning" class="row warning">
      <UiIcon :icon="faWarning" />
      {{ warning }}
    </p>

    <CodeHighlight v-if="componentPath" class="code-highlight" :code="template" />
  </UiCard>
</template>

<script lang="ts" setup>
import CodeHighlight from '@/components/CodeHighlight.vue'
import FormInput from '@/components/form/FormInput.vue'
import FormSelect from '@/components/form/FormSelect.vue'
import UiIcon from '@/components/ui/icon/UiIcon.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiCardTitle from '@/components/ui/UiCardTitle.vue'
import UiButton from '@core/components/button/UiButton.vue'
import { faWarning } from '@fortawesome/free-solid-svg-icons'
import { castArray } from 'lodash-es'
import { type ComponentOptions, computed, ref, watch } from 'vue'

const componentPath = ref('')

const components = import.meta.glob<{ default: ComponentOptions }>(
  ['/src/components/**/*.vue', '/../web-core/lib/components/**/*.vue'],
  { eager: true }
)

const componentsWithProps = Object.fromEntries(
  Object.entries(components).filter(([, component]) => component.default.props || component.default.emits)
)

const componentPaths = Object.keys(componentsWithProps)

function pathToOptionLabel(path: string) {
  return path.replace('../web-core/lib/components/', '[XO Web Core] ').replace('/src/components/', '[XO Lite] ')
}

const lines = ref<string[]>([])
const slots = ref('')

const quote = (str: string) => `'${str}'`
const camel = (str: string) => str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase())
const paramsToImport = ref(new Set<string>())
const widgetsToImport = ref(new Set<string>())

const template = computed(() => {
  const componentName = componentPath.value.replace(/.*\/([^/]+)\.vue$/, '$1')
  const path = componentPath.value.replace(/^\/src/, '@').replace(/^\.\.\/web-core\/lib/, '@core')
  const paramsLines = [...lines.value]
  const slotsNames = slots.value
    .split(',')
    .map(s => s.trim())
    .filter(name => name !== '')

  for (const slotName of slotsNames) {
    paramsLines.push(`slot(${slotName === 'default' ? '' : quote(camel(slotName))})`)
  }

  for (const slotName of slotsNames) {
    paramsLines.push(
      `setting(${quote(
        `${camel(slotName)}SlotContent`
      )}).preset('Example content for ${slotName} slot').widget(text()).help('Content for ${slotName} slot')`
    )
  }

  if (slotsNames.length > 0) {
    paramsToImport.value.add('slot').add('setting')
    widgetsToImport.value.add('text')
  }

  const paramsStr = paramsLines.join(',\n      ')
  const scriptEndTag = '</' + 'script>'
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
            .map(name =>
              name === 'default'
                ? `{{ settings.${camel(name)}SlotContent }}`
                : `<template #${name}>{{ settings.${camel(name)}SlotContent }}</template>`
            )
            .join('\n      ')}
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
    ? `import { ${Array.from(paramsToImport.value.values()).join(', ')} } from "@/libs/story/story-param"`
    : ''
}
${
  widgetsToImport.value.size > 0
    ? `import { ${Array.from(widgetsToImport.value.values()).join(', ')} } from "@/libs/story/story-widget"`
    : ''
}
${scriptEndTag}
`
})

const warnings = ref(new Set<string>())

const extractTypeFromConstructor = (ctor: null | (new () => unknown), propName: string) => {
  if (ctor == null) {
    warnings.value.add(`An unknown type has been detected for prop "${propName}"`)
    return 'unknown'
  }

  if (ctor === Date) {
    return 'Date'
  }

  return ctor.name.toLocaleLowerCase()
}

watch(
  componentPath,
  (path: string) => {
    if (!(path in components)) {
      return
    }
    const component = components[path].default

    slots.value = ''
    widgetsToImport.value = new Set()
    paramsToImport.value = new Set()
    warnings.value = new Set()
    lines.value = []

    for (const propName in component.props) {
      const current = []
      const prop = component.props[propName]

      if (prop.required) {
        current.push('required()')
      }

      if (prop.default) {
        current.push(`default(${quote(prop.default)})`)
      }

      if (prop.type !== undefined) {
        const type = castArray(prop.type)
          .map(ctor => extractTypeFromConstructor(ctor, propName))
          .join(' | ')

        switch (type) {
          case 'boolean':
            current.push('bool()')
            break
          case 'number':
            current.push('num()')
            break
          case 'string':
            current.push('str()')
            break
          case 'object':
            current.push('obj()')
            break
          case 'array':
            current.push('arr()')
            break
          case 'unknown':
            break
          default:
            current.push(`type(${quote(type)})`)
        }
      }

      const isModel = component.emits?.includes(`update:${propName}`)
      paramsToImport.value.add(isModel ? 'model' : 'prop')

      current.unshift(`${isModel ? 'model' : 'prop'}(${propName === 'modelValue' ? '' : quote(propName)})`)

      if (!isModel) {
        current.push('widget()')
      }

      lines.value.push(current.join('.'))
    }

    let shouldImportEvent = false

    if (component.emits) {
      for (const eventName of component.emits) {
        if (eventName.startsWith('update:')) {
          continue
        }

        shouldImportEvent = true
        lines.value.push(`event(${quote(eventName)})`)
      }
    }

    if (shouldImportEvent) {
      paramsToImport.value.add('event')
    }
  },
  { immediate: true }
)
</script>

<style lang="postcss" scoped>
.home-view {
  margin: 1rem;
}

.slots {
  display: inline-flex;
  align-items: stretch;
  gap: 1rem;

  :deep(input) {
    height: 100%;
  }
}

.row {
  margin-bottom: 2rem;
  font-size: 1.6rem;
}

.warning {
  font-size: 1.6rem;
  font-weight: 600;
  color: var(--color-warning-txt-base);
}

.code-highlight {
  margin-top: 1rem;
}
</style>
