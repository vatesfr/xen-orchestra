import Box from '@mui/material/Box'
import React from 'react'
import CircularProgress, { CircularProgressProps } from '@mui/material/CircularProgress'
import { styled } from '@mui/material/styles'
import { withState } from 'reaclette'

const BackgroundCircle = styled(CircularProgress)({
  color: '#e3dede',
})

const Container = styled(Box)({
  position: 'relative',
  display: 'inline-flex',
})

const Percent = styled('p')(({ color, theme: { palette } }) => ({
  color: (palette[color ?? 'primary'] ?? palette.primary).main,
  fontWeight: 'bold',
}))

const BackgroundWrapperChildren = styled(Box)({
  position: 'absolute',
})

const WrapperChildren = styled(Box)({
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
})

interface ParentState {}

interface State {}

interface Props {
  base?: number
  color?: CircularProgressProps['color']
  label?: { (progress: number, value: number): string } | string
  showLabel?: boolean
  size?: number
  value: number
}

interface ParentEffects {}

interface Effects {}

interface Computed {}

const ProgressCircle = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {},
  ({ base = 100, color = 'success', label, showLabel = true, size = 100, value }) => {
    const progress = Math.round((value / base) * 100)
    const _label = (typeof label === 'function' ? label(progress, value) : label) ?? `${progress}%`
    return (
      <Container>
        <BackgroundWrapperChildren>
          <BackgroundCircle variant='determinate' value={100} size={size} />
        </BackgroundWrapperChildren>
        <CircularProgress aria-label={_label} color={color} size={size} value={progress} variant='determinate' />
        {showLabel && (
          <WrapperChildren>
            <Percent color={color}>{_label}</Percent>
          </WrapperChildren>
        )}
      </Container>
    )
  }
)

export default ProgressCircle
