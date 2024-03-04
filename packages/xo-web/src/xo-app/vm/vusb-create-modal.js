import _ from 'intl'
import Component from 'base-component'
import React from 'react'
import { Select } from 'form'

const PUSB_RENDERER = pusb => `${pusb.description} (${pusb.version})`

export default class VusbCreateModal extends Component {
  state = {
    pusb: undefined,
  }

  get value() {
    return this.state.pusb
  }
  render() {
    return (
      <Select
        options={this.props.pusbs}
        optionRenderer={PUSB_RENDERER}
        placeholder={_('selectPusb')}
        onChange={this.linkState('pusb')}
        value={this.state.pusb}
      />
    )
  }
}
