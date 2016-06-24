import React from 'react'

import styles from './index.css'

const Page = ({ children, header }) => {
  return (
    <div className={styles.container}>
      <nav className={'page-header ' + styles.header}>
        {header}
      </nav>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  )
}
export { Page as default }
