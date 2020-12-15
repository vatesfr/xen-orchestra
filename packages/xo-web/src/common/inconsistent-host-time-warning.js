import _ from 'intl'
import decorate from 'apply-decorators'
import Icon from 'icon'
import PropTypes from 'prop-types'
import React from 'react'
import Tooltip from 'tooltip'
import { injectState, provideState } from 'reaclette'
import { isHostTimeConsistentWithXoaTime } from 'xo'

const InconsistentHostTimeWarning = decorate([
  provideState({
    computed: {
      isHostTimeConsistentWithXoaTime: (_, { host }) => isHostTimeConsistentWithXoaTime(host),
    },
  }),
  injectState,
  ({ state: { isHostTimeConsistentWithXoaTime = true } }) =>
    isHostTimeConsistentWithXoaTime ? null : (
      <Tooltip content={_('warningHostTimeTooltip')}>
        <Icon color='text-danger' icon='alarm' />
      </Tooltip>
    ),
])

InconsistentHostTimeWarning.propTypes = {
  host: PropTypes.object.isRequired,
}

export { InconsistentHostTimeWarning as default }
