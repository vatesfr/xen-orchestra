import _ from 'intl'
import Icon from 'icon'
import React from 'react'
import { Container } from 'grid'
import { form } from 'modal'
import { updateProxyApplianceNetworkConfiguration } from 'xo'

import NetworkConfiguration, {
  getNetworkConfiguration,
  NETWORK_CONFIGURATION_DEFAULT_VALUES,
} from './network-configuration'

const updateNetworkConfiguration = proxy =>
  form({
    defaultValue: NETWORK_CONFIGURATION_DEFAULT_VALUES,
    render: props => (
      <Container>
        <NetworkConfiguration {...props} />
      </Container>
    ),
    header: (
      <span>
        <Icon icon='network' /> {_('networkConfiguration')}
      </span>
    ),
  }).then(networkConfiguration =>
    updateProxyApplianceNetworkConfiguration(
      proxy,
      getNetworkConfiguration(networkConfiguration)
    )
  )

export { updateNetworkConfiguration as default }
