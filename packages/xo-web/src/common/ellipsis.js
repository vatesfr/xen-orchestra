import React from 'react'

const ellipsisStyle = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const ellipsisContainerStyle = {
  display: 'flex',
}

const Ellipsis = ({ children }) => <span style={ellipsisStyle}>{children}</span>
export { Ellipsis as default }

export const EllipsisContainer = ({ children }) => (
  <div style={ellipsisContainerStyle}>
    {React.Children.map(children, child =>
      child == null || child.type === Ellipsis || (child.type != null && child.type.originalRender === Ellipsis) ? (
        child
      ) : (
        <span>{child}</span>
      )
    )}
  </div>
)
