import React from 'react'

const Ellipsis = ({ children }) => {
  const style = {
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  }
  return (
    <span style={style}>
      {children}
    </span>
  )
}
export { Ellipsis as default }

export const EllipsisContainer = ({ children }) => {
  const style = { display: 'flex' }
  return (
    <div style={style}>
      {React.Children.map(children, child => <span>{child}</span>)}
    </div>
  )
}
