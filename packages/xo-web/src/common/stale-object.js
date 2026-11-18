import _ from 'intl'
import Icon from 'icon'
import PropTypes from 'prop-types'
import React from 'react'
import Tooltip from 'tooltip'
import { FormattedRelative, FormattedTime } from 'react-intl'

// objects of a disconnected pool are kept by xo-server, flagged with the last
// time the pool was reached
export const isStale = object => object?.$lastSeen !== undefined

const lastSeenValues = ({ $lastSeen }) => ({
  relative: <FormattedRelative value={$lastSeen} />,
  time: <FormattedTime day='numeric' hour='numeric' minute='numeric' month='long' value={$lastSeen} year='numeric' />,
})

export const StaleObjectPill = ({ object }) =>
  isStale(object) ? (
    <Tooltip content={_('staleObjectLastSeen', lastSeenValues(object))}>
      <span className='tag tag-pill tag-default ml-1'>
        <Icon icon='disconnected' /> {_('staleObject')}
      </span>
    </Tooltip>
  ) : null

StaleObjectPill.propTypes = {
  object: PropTypes.object,
}

export const StaleObjectBanner = ({ object }) =>
  isStale(object) ? (
    <div className='alert alert-warning'>
      <Icon icon='alarm' /> {_('staleObjectBanner', lastSeenValues(object))}
    </div>
  ) : null

StaleObjectBanner.propTypes = {
  object: PropTypes.object,
}
