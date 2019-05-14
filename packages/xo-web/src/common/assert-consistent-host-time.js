import _ from 'intl'
import decorate from 'apply-decorators'
import Icon from 'icon'
import PropTypes from 'prop-types'
import React from 'react'
import Tooltip from 'tooltip'
import { injectState, provideState } from 'reaclette'
import { isHostTimeConsistentToXoaTime } from 'xo'

const AssertConsistentHostTime = decorate([
  provideState({
    computed: {
      isHostTimeConsistentToXoaTime: (_, { hostId }) =>
        isHostTimeConsistentToXoaTime(hostId).then(() => true, () => false),
    },
  }),
  injectState,
  ({ state: { isHostTimeConsistentToXoaTime = true } }) =>
    isHostTimeConsistentToXoaTime ? null : (
      <Tooltip content={_('warningHostTimeTooltip')}>
        <Icon color='text-danger' icon='alarm' />
      </Tooltip>
    ),
])

AssertConsistentHostTime.propTypes = {
  hostId: PropTypes.string.isRequired,
}

export { AssertConsistentHostTime as default }
