<!-- VM v2 -->
<!-- Host v2 -->
<!-- SR v2 -->
<!-- Backup Repository v2 -->
<!-- Network v2 -->
<template>
  <FontAwesomeLayers :class="[toVariants({ size }), { muted: stateConfig === undefined }]" class="ui-object-icon">
    <VtsIcon :icon="mainIcon" accent="current" />
    <VtsIcon :icon="stateIcon" accent="current" :style="stateIconStyle" class="state" />
  </FontAwesomeLayers>
</template>

<script generic="TType extends SupportedType" lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import type { ObjectIconConfig, SupportedState, SupportedType } from '@core/types/object-icon.type'
import { toVariants } from '@core/utils/to-variants.util'
import {
  faCheckCircle,
  faCircleMinus,
  faCircleXmark,
  faDatabase,
  faDisplay,
  faMoon,
  faNetworkWired,
  faPause,
  faPlay,
  faServer,
  faStop,
  faTriangleExclamation,
  faWarehouse,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeLayers } from '@fortawesome/vue-fontawesome'
import { computed } from 'vue'

export type ObjectIconSize = 'small' | 'medium' | 'large'

const props = withDefaults(
  defineProps<{
    type: TType
    size: ObjectIconSize
    state?: SupportedState<TType> | 'disabled'
  }>(),
  { state: 'disabled' }
)

const config: ObjectIconConfig = {
  vm: {
    mainIcon: faDisplay,
    states: {
      running: {
        icon: faPlay,
        color: '--color-success-item-base',
        translate: {
          x: [100, 132, 148],
          y: [65, 75, 90],
        },
      },
      halted: {
        icon: faStop,
        color: '--color-danger-item-base',
        translate: {
          x: [100, 136, 144],
          y: [65, 75, 90],
        },
      },
      suspended: {
        icon: faMoon,
        color: '--color-info-item-base',
        translate: {
          x: [88, 130, 140],
          y: [65, 75, 90],
        },
      },
      paused: {
        icon: faPause,
        color: '--color-info-item-active',
        translate: {
          x: [110, 154, 170],
          y: [65, 75, 90],
        },
      },
    },
  },
  host: {
    mainIcon: faServer,
    states: {
      running: {
        icon: faPlay,
        color: '--color-success-item-base',
        translate: {
          x: [82, 122, 136],
          y: [66, 70, 90],
        },
      },
      halted: {
        icon: faStop,
        color: '--color-danger-item-base',
        translate: {
          x: [90, 122, 134],
          y: [65, 72, 85],
        },
      },
      maintenance: {
        icon: faTriangleExclamation,
        color: '--color-warning-item-base',
        translate: {
          x: [60, 88, 100],
          y: [68, 72, 82],
        },
      },
    },
  },
  sr: {
    mainIcon: faDatabase,
    states: {
      connected: {
        icon: faCheckCircle,
        color: '--color-success-item-base',
        translate: {
          x: [60, 90, 100],
          y: [65, 75, 90],
        },
      },
      'partially-connected': {
        icon: faCircleMinus,
        color: '--color-warning-item-base',
        translate: {
          x: [60, 90, 100],
          y: [65, 75, 90],
        },
      },
      disconnected: {
        icon: faCircleXmark,
        color: '--color-danger-item-base',
        translate: {
          x: [60, 90, 100],
          y: [65, 75, 90],
        },
      },
    },
  },
  'backup-repository': {
    mainIcon: faWarehouse,
    states: {
      connected: {
        icon: faCheckCircle,
        color: '--color-success-item-base',
        translate: {
          x: [112, 130, 162],
          y: [74, 78, 102],
        },
      },
      disconnected: {
        icon: faCircleXmark,
        color: '--color-danger-item-base',
        translate: {
          x: [112, 130, 162],
          y: [74, 78, 102],
        },
      },
    },
  },
  network: {
    mainIcon: faNetworkWired,
    states: {
      connected: {
        icon: faCheckCircle,
        color: '--color-success-item-base',
        translate: {
          x: [84, 110, 128],
          y: [66, 72, 88],
        },
      },
      disconnected: {
        icon: faCircleXmark,
        color: '--color-danger-item-base',
        translate: {
          x: [84, 110, 128],
          y: [66, 72, 88],
        },
      },
    },
  },
}

const mainIcon = computed(() => config[props.type].mainIcon)
const stateConfig = computed(() => (props.state === 'disabled' ? undefined : config[props.type].states[props.state]))
const stateIcon = computed(() => stateConfig.value?.icon)

const stateIconStyle = computed(() => {
  if (stateConfig.value === undefined) {
    return undefined
  }

  let translateIndex: number

  if (props.size === 'small') {
    translateIndex = 0
  } else if (props.size === 'large') {
    translateIndex = 2
  } else {
    translateIndex = 1
  }

  return {
    color: `var(${stateConfig.value.color})`,
    '--state-icon-translate-x': `${stateConfig.value.translate.x[translateIndex]}%`,
    '--state-icon-translate-y': `${stateConfig.value.translate.y[translateIndex]}%`,
  }
})
</script>

<style lang="postcss" scoped>
.ui-object-icon {
  flex-shrink: 0;

  &.muted {
    color: var(--color-neutral-txt-secondary);
  }

  .state {
    transform: translate(var(--state-icon-translate-x), var(--state-icon-translate-y));
  }

  /* SIZE VARIANTS */

  &.size--small {
    font-size: 0.8rem;

    .state {
      font-size: 0.75em;
    }
  }

  &.size--medium {
    font-size: 1.6rem;

    .state {
      font-size: 0.625em;
    }
  }

  &.size--large {
    font-size: 2.4rem;

    .state {
      font-size: 0.5em;
    }
  }
}
</style>
