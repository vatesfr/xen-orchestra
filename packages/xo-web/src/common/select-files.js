import _ from 'intl'
import Component from 'base-component'
import Icon from 'icon'
import PropTypes from 'prop-types'
import React from 'react'
import omit from 'lodash/omit.js'

export default class SelectFiles extends Component {
  static propTypes = {
    multi: PropTypes.bool,
    label: PropTypes.node,
    onChange: PropTypes.func.isRequired,
  }

  _onChange = e => {
    const { multi, onChange } = this.props
    const { files } = e.target

    onChange(multi ? files : files[0])
  }

  render() {
    return (
      <label className='btn btn-secondary btn-file hidden'>
        <Icon icon='file' /> {this.props.label || _('browseFiles')}
        <input
          {...omit(this.props, ['hidden', 'label', 'onChange', 'multi'])}
          hidden
          onChange={this._onChange}
          type='file'
        />
      </label>
    )
  }
}
