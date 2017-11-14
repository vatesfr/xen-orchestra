import Component from 'base-component'
import propTypes from 'prop-types-decorator'
import React from 'react'
import ReactDropzone from 'react-dropzone'

import styles from './index.css'

@propTypes({
  onDrop: propTypes.func,
  message: propTypes.node
})
export default class Dropzone extends Component {
  render () {
    const { onDrop, message } = this.props

    return (
      <ReactDropzone
        onDrop={onDrop}
        className={styles.dropzone}
        activeClassName={styles.activeDropzone}
      >
        <div className={styles.dropzoneText}>{message}</div>
      </ReactDropzone>
    )
  }
}
