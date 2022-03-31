import Box from '@mui/material/Box'
import React from 'react'
import CircularProgress, { CircularProgressProps } from '@mui/material/CircularProgress'
import { styled } from '@mui/material/styles'
import { Typography } from '@mui/material'
import { withState } from 'reaclette'

const BackgroundBox = styled(Box)({
  position: 'absolute',
})

const BackgroundCircle = styled(CircularProgress)({
  color: '#e3dede',
})

const Container = styled(Box)({
  display: 'inline-flex',
  position: 'relative',
})

const StyledLabel = styled(Typography)(({ color, theme: { palette } }) => ({
  color: (palette[(color as string) ?? 'primary'] ?? palette.primary).main,
  textAlign: 'center',
}))

const LabelBox = styled(Box)({
  alignItems: 'center',
  bottom: 0,
  display: 'flex',
  height: '80%',
  justifyContent: 'center',
  left: 0,
  margin: 'auto',
  overflow: 'hidden',
  position: 'absolute',
  right: 0,
  top: 0,
  width: '80%',
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
          <StyledLabel variant='h5' color={color}>
            {label}
          </StyledLabel>
        </LabelBox>
      )}
    </Container>
  )
)

export default ProgressCircle
