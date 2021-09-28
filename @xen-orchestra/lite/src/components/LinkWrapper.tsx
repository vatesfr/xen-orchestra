import React from 'react'
import { Link } from 'react-router-dom'

const LinkWrapper = ({ children, to, style }: { children: React.ReactNode; to?: string | object; style?: object }) =>
  to !== undefined ? (
    <Link to={to} style={style}>
      {children}
    </Link>
  ) : (
    <span>{children}</span>
  )

export default LinkWrapper
