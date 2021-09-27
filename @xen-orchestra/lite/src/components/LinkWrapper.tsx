import React from 'react'
import { Link } from 'react-router-dom'

const LinkWrapper = ({
  children,
  link,
  to,
  style,
}: {
  children: React.ReactNode
  link?: boolean
  to?: string | object
  style?: object
}) =>
  link ? (
    <Link to={to} style={style}>
      {children}
    </Link>
  ) : (
    <span>{children}</span>
  )

export default LinkWrapper
