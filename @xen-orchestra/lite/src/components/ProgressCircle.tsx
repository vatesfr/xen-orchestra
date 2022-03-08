import Box from '@mui/material/Box'
import React from 'react'
import CircularProgress, { CircularProgressProps } from '@mui/material/CircularProgress'
import { SxProps } from '@mui/system'
import { Theme } from '@mui/material/styles'
import { withState } from 'reaclette'

const STYLES: {
  bgCircle: SxProps<Theme>
  containerCircle: SxProps<Theme>
  wrapperBgCircle: SxProps<Theme>
  wrapperChildren: SxProps<Theme>
} = {
  bgCircle: {
    color: '#e3dede',
  },
  containerCircle: { position: 'relative', display: 'inline-flex' },
  wrapperBgCircle: {
    position: 'absolute',
  },
  wrapperChildren: {
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}

interface ParentState {}

interface State {}

interface Props {
  base?: number
  children?: { (progress: number, value: number): React.ReactNode } | React.ReactNode
  color?: CircularProgressProps['color']
  haveBackgroundCircle?: boolean
  size?: number
  value: number
}

interface ParentEffects {}

interface Effects {}

interface Computed {}

const ProgressCircle = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {},
  ({ base = 100, children, color = 'success', haveBackgroundCircle = true, size = 100, value }) => {
    const progress = Math.round((value / base) * 100)

    return (
      <Box sx={STYLES.containerCircle}>
        {haveBackgroundCircle && (
          <Box sx={STYLES.wrapperBgCircle}>
            <CircularProgress variant='determinate' value={100} size={size} sx={STYLES.bgCircle} />
          </Box>
        )}
        <CircularProgress variant='determinate' value={progress} size={size} color={color} />
        {children !== undefined && (
          <Box sx={STYLES.wrapperChildren}>{typeof children === 'function' ? children(progress, value) : children}</Box>
        )}
      </Box>
    )
  }
)

export default ProgressCircle
