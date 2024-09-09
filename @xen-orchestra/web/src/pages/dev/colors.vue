<template>
  <div class="groups">
    <div v-for="(colorLines, colorGroup) of colors" :key="colorGroup">
      <h2 class="typo c2-semi-bold group-name">{{ colorGroup }}</h2>
      <div class="lines">
        <div v-for="(colorLine, index) of colorLines" :key="index" class="line">
          <div v-for="color of colorLine" :key="color" class="color">
            <div
              v-tooltip="getTooltip(colorGroup, color)"
              :style="`background-color: var(--color-${colorGroup}-${color})`"
              class="square"
              @click="copy(`--color-${colorGroup}-${color}`)"
            />
            {{ color }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { vTooltip } from '@core/directives/tooltip.directive'
import { useClipboard } from '@vueuse/core'

type ColorGroup = 'neutral' | 'normal' | 'success' | 'warning' | 'danger'

const { copy, text, copied } = useClipboard()

const colors: Record<ColorGroup, string[][]> = {
  neutral: [
    ['txt-primary', 'txt-secondary', 'background-primary', 'background-secondary', 'background-disabled', 'border'],
  ],
  normal: [],
  success: [],
  warning: [],
  danger: [],
}

;(['normal', 'success', 'warning', 'danger'] as const).forEach(group => {
  colors[group].push([
    `txt-base`,
    `txt-hover`,
    `txt-active`,
    `background-selected`,
    `background-hover`,
    `background-active`,
  ])

  colors[group].push([`txt-item`, `item-base`, `item-hover`, `item-active`, `item-disabled`])
})

function getTooltip(colorGroup: ColorGroup, color: string) {
  const variable = `--color-${colorGroup}-${color}`
  return copied.value && text.value === variable ? 'Copied!' : `Click to copy`
}
</script>

<style lang="postcss" scoped>
.groups {
  display: flex;
  flex-direction: column;
  gap: 3rem;
  padding: 4rem;
}

.group-name {
  margin-bottom: 1rem;
}

.lines {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.line {
  display: flex;
  gap: 1rem;
}

.color {
  flex: 1;
}

.square {
  border: 1px solid var(--color-neutral-border);
  width: 100%;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  .click-to-copy {
    display: none;
  }

  &:hover {
    .click-to-copy {
      display: block;
    }
  }
}
</style>
