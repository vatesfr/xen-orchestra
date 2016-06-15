import React, { PropTypes } from 'react'

import styles from './index.css'

const Tooltip = ({ children, content, tagName: Component = 'span' }) => (
  <Component className={styles.container}>
    <div className={styles.arrow} />
    <div className={styles.tooltip}>
      {content}
    </div>
    {children}
  </Component>
)

Tooltip.propTypes = {
  children: PropTypes.any,
  content: PropTypes.any.isRequired,
  tagName: PropTypes.string
}

export { Tooltip as default }
