import React from 'react'

const Label = ({ children, ...props }) => (
  <label {...props} style={{ cursor: 'pointer' }}>
    <strong>{children}</strong>
  </label>
)

export { Label as default }
