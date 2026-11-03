<template>
  <div class="vdf-trace-path" :class="`verdict--${verdict}`">
    <div class="header">
      <span class="typo-body-bold-small">{{ t('firewall:trace:path') }}</span>
      <UiButton
        variant="tertiary"
        accent="brand"
        size="small"
        left-icon="fa:play"
        :aria-label="t('firewall:trace:path:replay')"
        @click="replay()"
      >
        {{ t('firewall:trace:path:replay') }}
      </UiButton>
    </div>
    <div class="scroller">
      <ol :key="run" class="track" :style="trackStyle">
        <li class="line" aria-hidden="true" />
        <li class="line done" aria-hidden="true" />
        <li class="packet" aria-hidden="true" />
        <li
          v-for="(node, index) of nodes"
          :key="node.key"
          v-tooltip="node.detail ?? false"
          class="node"
          :class="[
            `node--${node.outcome}`,
            { start: index === 0, reached: index <= stop, stop: index === stop, after: index > stop },
          ]"
          :style="{ '--index': index }"
          tabindex="0"
        >
          <span class="dot"><VtsIcon :name="node.icon" size="small" /></span>
          <span class="label typo-body-bold-small">{{ node.label }}</span>
          <span v-if="node.note" class="note typo-body-regular-small">{{ node.note }}</span>
        </li>
      </ol>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { IconName } from '@core/icons'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

export type VdfTracePathNode = {
  key: string
  label: string
  // under the label: the policy and rule that decided, or "no rule matched"
  note?: string
  // the step in full, as the list below says it
  detail?: string
  outcome: 'end' | 'pass' | 'allow' | 'drop'
  icon: IconName
}

// A trace as a path: the source, each tier the packet goes through, the
// destination. The packet travels to the step that decides and stops
// there: green on to the destination, red where it's dropped, the rest
// greyed. One step at a time (--step), as the trace reads; at once when
// the system asks for less motion.
const { nodes, stop, verdict } = defineProps<{
  nodes: VdfTracePathNode[]
  // the index of the node the packet stops at
  stop: number
  verdict: 'allowed' | 'dropped'
}>()

const { t } = useI18n()

// a new key replays the animation
const run = ref(0)

function replay() {
  run.value++
}

// the nodes' centers, as a share of the track: the line from the first to
// the last, the packet from the first to where it stops
const trackStyle = computed(() => {
  const count = nodes.length
  const center = (index: number) => `${((index + 0.5) / count) * 100}%`

  return {
    '--count': count,
    '--first': center(0),
    '--last': center(count - 1),
    '--stop': center(stop),
    '--stop-index': stop,
  }
})
</script>

<style lang="postcss" scoped>
.vdf-trace-path {
  --step: 0.45s;
  --dot-size: 3.2rem;
  --pass-color: var(--color-info-txt-base);
  --allow-color: var(--color-success-txt-base);
  --drop-color: var(--color-danger-txt-base);

  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  padding: 1.6rem;
  border: 0.1rem solid var(--color-neutral-border);
  border-radius: 0.8rem;
  background-color: var(--color-neutral-background-primary);

  &.verdict--allowed {
    --verdict-color: var(--allow-color);
  }

  &.verdict--dropped {
    --verdict-color: var(--drop-color);
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: var(--color-neutral-txt-secondary);
  }

  /* a long path scrolls rather than squeezing its labels */
  .scroller {
    overflow-x: auto;
  }

  .track {
    position: relative;
    display: grid;
    grid-template-columns: repeat(var(--count), minmax(11rem, 1fr));
    margin: 0;
    padding: 0.4rem 0 0;
    list-style: none;
  }

  /* the path, then its part the packet went along, drawn as it goes */
  .line {
    position: absolute;
    inset-block-start: calc(0.4rem + var(--dot-size) / 2 - 0.15rem);
    inset-inline-start: var(--first);
    width: calc(var(--last) - var(--first));
    height: 0.3rem;
    border-radius: 0.15rem;
    background-color: var(--color-neutral-border);

    &.done {
      width: calc(var(--stop) - var(--first));
      background-color: var(--verdict-color);
      transform-origin: left;
      animation: draw calc(var(--step) * var(--stop-index)) linear both;
    }
  }

  .packet {
    position: absolute;
    z-index: 2;
    inset-block-start: calc(0.4rem + var(--dot-size) / 2 - 0.6rem);
    inset-inline-start: calc(var(--first) - 0.6rem);
    width: 1.2rem;
    height: 1.2rem;
    border-radius: 50%;
    background-color: var(--verdict-color);
    box-shadow: 0 0 0 0.4rem color-mix(in srgb, var(--verdict-color) 25%, transparent);
    animation:
      travel calc(var(--step) * var(--stop-index)) linear both,
      fade 0.3s ease-in calc(var(--step) * var(--stop-index) + 0.2s) both;
  }

  .node {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    padding-inline: 0.4rem;
    text-align: center;

    .dot {
      display: flex;
      align-items: center;
      justify-content: center;
      width: var(--dot-size);
      height: var(--dot-size);
      border: 0.2rem solid var(--color-neutral-border);
      border-radius: 50%;
      color: var(--color-neutral-txt-secondary);
      background-color: var(--color-neutral-background-primary);
    }

    .label {
      color: var(--color-neutral-txt-primary);
      overflow-wrap: anywhere;
    }

    .note {
      color: var(--color-neutral-txt-secondary);
      overflow-wrap: anywhere;
    }

    /* each node lights up as the packet reaches it */
    &.reached .dot {
      animation: reach 0.25s ease-out calc(var(--step) * var(--index)) both;
    }

    &.reached.node--pass .dot {
      --reach-color: var(--pass-color);
    }

    &.reached.node--allow .dot,
    &.reached.node--end .dot {
      --reach-color: var(--verdict-color);
    }

    &.reached.node--drop .dot {
      --reach-color: var(--drop-color);
    }

    /* the source: where the packet leaves, not a verdict */
    &.reached.start .dot {
      --reach-color: var(--color-brand-item-base);
    }

    /* where it stops: the verdict, larger */
    &.stop .dot {
      animation: reach 0.25s ease-out calc(var(--step) * var(--index)) both,
        verdict 0.5s ease-out calc(var(--step) * var(--index) + 0.15s) both;
    }

    &.after {
      opacity: 0.45;
    }
  }

  @keyframes draw {
    from {
      transform: scaleX(0);
    }

    to {
      transform: scaleX(1);
    }
  }

  @keyframes travel {
    from {
      inset-inline-start: calc(var(--first) - 0.6rem);
    }

    to {
      inset-inline-start: calc(var(--stop) - 0.6rem);
    }
  }

  @keyframes fade {
    to {
      opacity: 0;
    }
  }

  @keyframes reach {
    to {
      border-color: var(--reach-color);
      color: var(--color-neutral-background-primary);
      background-color: var(--reach-color);
    }
  }

  @keyframes verdict {
    0% {
      box-shadow: 0 0 0 0 color-mix(in srgb, var(--reach-color) 50%, transparent);
    }

    100% {
      box-shadow: 0 0 0 1rem transparent;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    --step: 0s;

    .packet {
      display: none;
    }
  }
}
</style>
