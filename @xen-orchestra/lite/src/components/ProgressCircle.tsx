import React from 'react'
import { withState } from 'reaclette'

interface ParentState {}

interface State {
  circleRef: React.RefObject<SVGCircleElement>
}

interface Props {
  base?: number
  children?: { (progress: number): React.ReactNode } | React.ReactNode
  progress: number
  secondaryColor?: string
  secondaryWidth?: number
  size?: number
  strokeColor: string
  strokeWidth?: number
}

interface ParentEffects {}

interface Effects {}

interface Computed {}

const ProgressCircle = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: () => ({
      circleRef: React.createRef(),
    }),
    effects: {
      initialize: function () {
        if (this.state.circleRef.current === null) {
          throw new Error('Failed to initalize "circleRef"')
        }
        this.state.circleRef.current.style.transition = 'stroke-dashoffset 250ms ease-out'
      },
    },
  },

  ({
    base = 100,
    children,
    progress,
    secondaryColor,
    secondaryWidth = 7,
    size = 100,
    state: { circleRef },
    strokeColor,
    strokeWidth = 10,
  }) => {
    const center = size / 2
    const radius = size / 2 - strokeWidth / 2
    const circumference = 2 * Math.PI * radius
    const offset = ((base - progress) / base) * circumference

    const styles: {
      containerCircle: React.CSSProperties
      wrapperChildren: React.CSSProperties
    } = {
      containerCircle: {
        display: 'flex',
        justifyContent: 'center',
        position: 'relative',
        height: size,
        width: size,
      },
      wrapperChildren: {
        alignItems: 'center',
        borderRadius: 100,
        bottom: 0,
        display: 'flex',
        height: size - strokeWidth * 2,
        justifyContent: 'center',
        left: 0,
        margin: 'auto',
        overflow: 'hidden',
        position: 'absolute',
        right: 0,
        textAlign: 'center',
        top: 0,
        width: size - strokeWidth * 2,
      },
    }

    return (
      <div style={styles.containerCircle}>
        <svg>
          <circle
            cx={center}
            cy={center}
            fill='none'
            r={radius}
            stroke={secondaryColor}
            strokeDasharray={circumference}
            strokeWidth={secondaryWidth}
          />
          <circle
            cx={center}
            cy={center}
            fill='none'
            r={radius}
            ref={circleRef}
            stroke={strokeColor}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeWidth={strokeWidth}
            transform={`rotate(-90 ${center} ${center})`}
          />
        </svg>
        <div style={styles.wrapperChildren}>
          {children !== undefined ? (typeof children === 'function' ? children(progress) : children) : null}
        </div>
      </div>
    )
  }
)

export default ProgressCircle
