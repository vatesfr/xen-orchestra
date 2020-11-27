import React from 'react'

import ActionButton from '../action-button'

import styles from './index.css'

const ActionRowButton = props => <ActionButton {...props} className={styles.button} size='small' />
export { ActionRowButton as default }
