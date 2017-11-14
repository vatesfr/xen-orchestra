import React from 'react'

import styles from './index.css'

const CenterPanel = ({ children }) => (
  <div className={styles.container}>
    <div className={styles.content}>{children}</div>
  </div>
)

export { CenterPanel as default }
