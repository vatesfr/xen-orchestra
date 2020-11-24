import classNames from 'classnames'
import React from 'react'

import Link from './link'

export const NavLink = ({ children, exact, to }) => (
  <li className='nav-item' role='tab'>
    <Link activeClassName='active' className='nav-link' onlyActiveOnIndex={exact} to={to}>
      {children}
    </Link>
  </li>
)

export const NavTabs = ({ children, className }) => (
  <ul className={classNames(className, 'nav nav-tabs')} role='tablist'>
    {children}
  </ul>
)
