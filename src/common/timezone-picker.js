import ActionButton from 'action-button'
import map from 'lodash/map'
import moment from 'moment-timezone'
import React from 'react'

import _ from './intl'
import Component from './base-component'
import propTypes from './prop-types'
import { getXoServerTimezone } from './xo'
import { Select } from './form'

const XO_SERVER_TIMEZONE = 'xo-server'

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
    const value = this.refs.select.value
    return (value === XO_SERVER_TIMEZONE) ? null : value
  }

  set value (value) {
    this.refs.select.value = value || XO_SERVER_TIMEZONE
  }

  _updateTimezone (value) {
    this.props.onChange(value)
  }
  _handleChange = option => {
    return this._updateTimezone(
      !option || option.value === XO_SERVER_TIMEZONE
        ? null
        : option.value
    )
  }
  _useServerTime = () => {
    this._updateTimezone(null)
  }
  _useLocalTime = () => {
    this._updateTimezone(moment.tz.guess())
  }

  componentWillMount () {
    // Use local timezone (Web browser) if no default value.
    if (this.props.value === undefined) {
      this._useLocalTime()
    }

    getXoServerTimezone.then(serverTimezone => {
      this.setState({
        options: [{
          label: _('serverTimezoneOption', {
            value: serverTimezone
          }),
          value: XO_SERVER_TIMEZONE
        }].concat(this.state.options),
        serverTimezone
      })
    })
  }

  render () {
    const { props, state } = this
    return (
      <div>
        <div className='alert alert-info' role='alert'>
          {_('timezonePickerServerValue')} <strong>{state.serverTimezone}</strong>
        </div>
        <Select
          className='mb-1'
          defaultValue={props.defaultValue}
          onChange={this._handleChange}
          options={state.options}
          placeholder={_('selectTimezone')}
          ref='select'
          value={props.value || XO_SERVER_TIMEZONE}
        />
        <div className='pull-right'>
          <ActionButton
            btnStyle='primary'
            className='mr-1'
            handler={this._useServerTime}
            icon='time'
          >
            {_('timezonePickerUseServerTime')}
          </ActionButton>
          <ActionButton
            btnStyle='secondary'
            handler={this._useLocalTime}
            icon='time'
          >
            {_('timezonePickerUseLocalTime')}
          </ActionButton>
        </div>
      </div>
    )
  }
}
