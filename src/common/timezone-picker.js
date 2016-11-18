import ActionButton from 'action-button'
import map from 'lodash/map'
import moment from 'moment-timezone'
import React from 'react'

import _ from './intl'
import Component from './base-component'
import propTypes from './prop-types'
import { getXoServerTimezone } from './xo'
import { Select } from './form'

const SERVER_TIMEZONE = 'server'

@propTypes({
  defaultValue: propTypes.string,
  onChange: propTypes.func.isRequired,
  required: propTypes.bool,
  value: propTypes.string
})
export default class TimezonePicker extends Component {
  constructor (props) {
    super(props)

    this.localTimezone = moment.tz.guess()
    this.serverTimezone = SERVER_TIMEZONE
  }

  componentWillMount () {
    const options = map(moment.tz.names(), value => ({ label: value, value }))
    getXoServerTimezone.then(serverTimezone => {
      this.options = [{
        label: _('serverTimezoneOption', {
          value: serverTimezone
        }),
        value: this.serverTimezone
      }].concat(options)

      this.setState({
        timezone: this.props.value || this.props.defaultValue || this.serverTimezone
      })
    })
  }

  componentWillReceiveProps (props) {
    if (props !== this.props) {
      this.setState({ timezone: props.value || this.serverTimezone })
    }
  }

  get value () {
    return this.state.timezone === this.serverTimezone ? undefined : this.state.timezone
  }

  set value (value) {
    this.setState({ timezone: value })
  }

  _onChange = option => {
    if (option && option.value === this.state.timezone) {
      return
    }

    this.setState({
      timezone: option && option.value
    }, () =>
      this.props.onChange(option && (option.value === this.serverTimezone ? undefined : option.value))
    )
  }

  _useLocalTime = () => {
    this._onChange({ value: this.localTimezone })
  }

  render () {
    const { timezone } = this.state

    return (
      <div>
        <Select
          className='mb-1'
          onChange={this._onChange}
          options={this.options}
          placeholder={_('selectTimezone')}
          required={this.props.required}
          value={timezone}
        />
        <div className='pull-right'>
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
