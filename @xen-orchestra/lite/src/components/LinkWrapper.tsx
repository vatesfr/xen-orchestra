import React from 'react'
import { Link } from 'react-router-dom'

const LinkWrapper = ({ children, link, to }: { children: any; link?: boolean; to?: string | object }) =>
  link ? <Link to={to}>{children}</Link> : <span>{children}</span>

export default LinkWrapper
