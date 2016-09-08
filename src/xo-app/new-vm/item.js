import _ from 'intl'
import classNames from 'classnames'
import React from 'react'
import styles from './index.css'

export const Item = ({ label, children, className }) => (
  <span className={styles.item}>
    {label && <span>{_(label)}&nbsp;</span>}
    <span className={classNames(styles.input, className)}>{children}</span>
  </span>
)
export { Item as default }

export const SectionContent = ({ summary, column, children }) => (
  <div className={classNames(
    'form-inline',
    summary ? styles.summary : styles.sectionContent,
    column && styles.sectionContentColumn
  )}>
    {children}
  </div>
)

export const LineItem = ({ children }) => (
  <div className={styles.lineItem}>
    {children}
  </div>
)
