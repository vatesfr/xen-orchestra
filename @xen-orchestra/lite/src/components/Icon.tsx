import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconName as _IconName, library, SizeProp } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { useTheme } from '@mui/material/styles'

library.add(fas)

const Icon = ({
  color,
  htmlColor,
  icon,
  size,
}: {
  color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning'
  htmlColor?: string
  icon: _IconName
  size?: SizeProp
}): JSX.Element => {
  const { palette } = useTheme()
  return (
    <FontAwesomeIcon
      icon={icon}
      size={size}
      color={htmlColor ?? (color !== undefined ? palette[color][palette.mode] : undefined)}
    />
  )
}
export default Icon
export type IconName = _IconName
