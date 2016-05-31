import React, { PropTypes } from 'react'

import styles from './index.css'

const Tooltip = ({ children, content }) => (
  <span className={styles.container}>
    <div className={styles.arrow} />
    <div className={styles.tooltip}>
      {content}
    </div>
    {children}
  </span>
)

Tooltip.propTypes = {
  children: PropTypes.any.isRequired,
  content: PropTypes.any.isRequired
}

export { Tooltip as default }
