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

const Percent = styled('p')(
  ({
    color,
    theme: {
      palette: { primary, secondary, success, warning, error },
    },
  }) => {
    const getColor = (color?: string) => {
      switch (color) {
        case 'primary':
          return primary.main
        case 'secondary':
          return secondary.main
        case 'success':
          return success.main
        case 'warning':
          return warning.main
        case 'error':
          return error.main
        default:
          return primary.main
      }
    }
    return {
      color: getColor(color),
      fontWeight: 'bold',
    }
  }
)

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
  children?: { (progress: number, value: number): React.ReactNode } | React.ReactNode
  color?: CircularProgressProps['color']
  haveBackgroundCircle?: boolean
  showPercent?: boolean
  size?: number
  value: number
}

interface ParentEffects {}

interface Effects {}

interface Computed {}

const ProgressCircle = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {},
  ({ base = 100, children, color = 'success', haveBackgroundCircle = true, showPercent = true, size = 100, value }) => {
    const progress = Math.round((value / base) * 100)
    return (
      <Container>
        {haveBackgroundCircle && (
          <BackgroundWrapperChildren>
            <BackgroundCircle variant='determinate' value={100} size={size} />
          </BackgroundWrapperChildren>
        )}
        <CircularProgress
          aria-label={`${progress}%`}
          variant='determinate'
          value={progress}
          size={size}
          color={color}
        />
        {children !== undefined ? (
          <WrapperChildren>{typeof children === 'function' ? children(progress, value) : children}</WrapperChildren>
        ) : (
          showPercent && (
            <WrapperChildren>
              <Percent color={color}>{progress}%</Percent>
            </WrapperChildren>
          )
        )}
      </Container>
    )
  }
)

export default ProgressCircle
