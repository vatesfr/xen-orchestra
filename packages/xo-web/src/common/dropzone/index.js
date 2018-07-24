import Component from 'base-component'
import propTypes from 'prop-types-decorator'
import React from 'react'
import ReactDropzone from 'react-dropzone'

import styles from './index.css'

@propTypes({
  onDrop: propTypes.func,
  message: propTypes.node,
  multiple: propTypes.bool,
})
export default class Dropzone extends Component {
  render () {
    const { onDrop, message, multiple } = this.props

    return (
      <ReactDropzone
        activeClassName={styles.activeDropzone}
        className={styles.dropzone}
        multiple={multiple}
        onDrop={onDrop}
      >
        <div className={styles.dropzoneText}>{message}</div>
      </ReactDropzone>
    )
  }
}
