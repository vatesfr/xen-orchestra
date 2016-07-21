import ActionButton from 'action-button'
import map from 'lodash/map'
import moment from 'moment-timezone'
import React from 'react'

import _ from './intl'
import Component from './base-component'
import propTypes from './prop-types'
import { getXoServerTimezone } from './xo'
import { Select } from './form'

@propTypes({
  defaultValue: propTypes.string,
  onChange: propTypes.func.isRequired,
  value: propTypes.string
})
export default class TimezonePicker extends Component {
  constructor (props) {
    super(props)
    this.state.options = map(moment.tz.names(), value => ({ label: value, value }))
  }

  get value () {
    return this.refs.select.value
  }

  set value (value) {
    this.refs.select.value = value
  }

  _updateTimezone (value) {
    this.props.onChange(value)
  }
  _handleChange = option => {
    this._updateTimezone(option && option.value)
  }
  _useLocalTime = () => {
    this._updateTimezone(moment.tz.guess())
  }

  componentWillMount () {
    // Use local timezone (Web browser) if no default value.
    if (!this.state.value) {
      this._useLocalTime()
    }

    getXoServerTimezone.then(serverTimezone => {
      this.setState({
        serverTimezone
      })
    })
  }

  render () {
    const { props, state } = this

    return (
      <div>
        <div className='alert alert-warning' role='alert'>
          {_('timezonePickerWarning')}
        </div>
        <div className='alert alert-info' role='alert'>
          {_('timezonePickerServerValue')} <strong>{state.serverTimezone}</strong>
        </div>
        <Select
          defaultValue={props.defaultValue}
          className='m-b-1'
          onChange={this._handleChange}
          options={state.options}
          placeholder={_('selectTimezone')}
          ref='select'
          value={props.value}
        />
        <div className='pull-right'>
          <ActionButton
            btnStyle='primary'
            handler={this._useLocalTime}
            icon='time'
          >
            {_('timezonePickerUseLocal')}
          </ActionButton>
        </div>
      </div>
    )
  }
}
