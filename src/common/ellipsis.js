import React from 'react'

const Ellipsis = ({ children }) => (
  <span style={{
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  }}>
    {children}
  </span>
)
export { Ellipsis as default }

export const EllipsisContainer = ({ children }) => (
  <div style={{
    display: 'flex'
  }}>
    {children}
  </div>
)
