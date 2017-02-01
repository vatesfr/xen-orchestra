import _ from 'intl'
import Component from 'base-component'
import Icon from 'icon'
import propTypes from 'prop-types'
import React from 'react'
import { omit } from 'lodash'

@propTypes({
  multi: propTypes.bool,
  label: propTypes.node,
  onChange: propTypes.func.isRequired
})
export default class SelectFiles extends Component {
  _onChange = e => {
    const { multi, onChange } = this.props
    const { files } = e.target

    onChange(multi ? files : files[0])
  }

  render () {
    return <label className='btn btn-secondary btn-file hidden'>
      <Icon icon='file' /> {this.props.label || _('browseFiles')}
      <input
        {...omit(this.props, [ 'hidden', 'label', 'onChange', 'multi' ])}
        hidden
        onChange={this._onChange}
        type='file'
      />
    </label>
  }
}
