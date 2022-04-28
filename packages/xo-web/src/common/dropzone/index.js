import Component from 'base-component'
import PropTypes from 'prop-types'
import React from 'react'
import ReactDropzone from 'react-dropzone'

import styles from './index.css'

export default class Dropzone extends Component {
  static propTypes = {
    onDrop: PropTypes.func,
    message: PropTypes.node,
    multiple: PropTypes.bool,
    accept: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
  }

  render() {
    const { onDrop, message, multiple, accept } = this.props

    return (
      <ReactDropzone
        accept={accept}
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
