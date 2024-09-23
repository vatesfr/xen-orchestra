<!-- VM v1.0 -->
<!-- Host v1.0 -->
<!-- SR v1.0 -->
<!-- Backup Repository v1.0 -->
<!-- Network v1.0 -->
<template>
  <FontAwesomeLayers :class="[size, { disabled: stateConfig === undefined }]" class="object-icon">
    <UiIcon :icon="mainIcon" color="current" />
    <UiIcon :icon="stateIcon" color="current" :style="stateIconStyle" class="state" />
  </FontAwesomeLayers>
</template>

<script generic="TType extends SupportedType" lang="ts" setup>
import UiIcon from '@core/components/icon/UiIcon.vue'
import type { ObjectIconConfig, ObjectIconSize, SupportedState, SupportedType } from '@core/types/object-icon.type'
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

const props = withDefaults(
  defineProps<{
    type: TType
    state?: SupportedState<TType> | 'disabled'
    size?: ObjectIconSize
  }>(),
  { size: 'small', state: 'disabled' }
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
        color: '--color-normal-item-base',
        translate: {
          x: [88, 130, 140],
          y: [65, 75, 90],
        },
      },
      paused: {
        icon: faPause,
        color: '--color-normal-item-active',
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

  if (props.size === 'extra-small') {
    translateIndex = 0
  } else if (props.size === 'medium') {
    translateIndex = 2
  } else {
    translateIndex = 1
  }

  return {
    '--color': `var(${stateConfig.value.color})`,
    '--state-icon-translate-x': `${stateConfig.value.translate.x[translateIndex]}%`,
    '--state-icon-translate-y': `${stateConfig.value.translate.y[translateIndex]}%`,
  }
})
</script>

<style lang="postcss" scoped>
/* SIZE VARIANTS */
.object-icon {
  &.extra-small {
    --font-size: 0.8rem;
    --state-icon-font-size: 0.75em;
  }

  &.small {
    --font-size: 1.6rem;
    --state-icon-font-size: 0.625em;
  }

  &.medium {
    --font-size: 2.4rem;
    --state-icon-font-size: 0.5em;
  }
}

/* IMPLEMENTATION */
.object-icon {
  flex-shrink: 0;
  font-size: var(--font-size);

  &.disabled {
    color: var(--color-neutral-txt-secondary);
  }
}

.state {
  font-size: var(--state-icon-font-size);
  transform: translate(var(--state-icon-translate-x), var(--state-icon-translate-y));
}
</style>
