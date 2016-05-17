import React from 'react'

const ellipsisStyle = {
  overflow: 'hidden',
  textOverflow: 'ellipsis'
}

const ellipsisContainerStyle = {
  display: 'flex'
}

const Ellipsis = ({ children }) => {
  return (
    <span style={ellipsisStyle}>
      {children}
    </span>
  )
}
export { Ellipsis as default }

export const EllipsisContainer = ({ children }) => {
  return (
    <div style={ellipsisContainerStyle}>
      {React.Children.map(children, child => <span>{child}</span>)}
    </div>
  )
}
