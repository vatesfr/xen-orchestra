import classNames from 'classnames'
import Link from 'react-router/lib/Link'
import React from 'react'

export const NavLink = ({ children, to }) => (
  <li className='nav-item' role='tab'>
    <Link className='nav-link' activeClassName='active' to={to}>
      {children}
    </Link>
  </li>
)

export const NavTabs = ({ children, className }) => (
  <ul className={classNames(className, 'nav nav-tabs')} role='tablist'>
    {children}
  </ul>
)
