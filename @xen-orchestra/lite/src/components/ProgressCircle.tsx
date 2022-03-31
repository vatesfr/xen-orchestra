import Box from '@mui/material/Box'
import React from 'react'
import CircularProgress, { CircularProgressProps } from '@mui/material/CircularProgress'
import { styled } from '@mui/material/styles'
import { withState } from 'reaclette'

const BackgroundBox = styled(Box)({
  position: 'absolute',
})

const BackgroundCircle = styled(CircularProgress)({
  color: '#e3dede',
})

const Container = styled(Box)({
  position: 'relative',
  display: 'inline-flex',
})

const Label = styled('p')(({ color, theme: { palette } }) => ({
  color: (palette[color ?? 'primary'] ?? palette.primary).main,
  fontWeight: 'bold',
}))

const LabelBox = styled(Box)({
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

interface Computed {
  label: string
  progress: number
}

const ProgressCircle = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    computed: {
      label: ({ progress }, { label, value }) =>
        (typeof label === 'function' ? label(progress, value) : label) ?? `${progress}%`,
      progress: (_, { base = 100, value }) => Math.round((value / base) * 100),
    },
  },
  ({ color = 'success', showLabel = true, size = 100, state: { label, progress } }) => (
    <Container>
      <BackgroundBox>
        <BackgroundCircle variant='determinate' value={100} size={size} />
      </BackgroundBox>
      <CircularProgress aria-label={label} color={color} size={size} value={progress} variant='determinate' />
      {showLabel && (
        <LabelBox>
          <Label color={color}>{label}</Label>
        </LabelBox>
      )}
    </Container>
  )
)

export default ProgressCircle
