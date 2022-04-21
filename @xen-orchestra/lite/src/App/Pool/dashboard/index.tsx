import Divider from '@mui/material/Divider'
import React from 'react'
import styled from 'styled-components'
import Typography from '@mui/material/Typography'
import { withState } from 'reaclette'

import ObjectStatus from './ObjectStatus'

import IntlMessage from '../../../components/IntlMessage'
import { Host, ObjectsByType, Vm } from '../../../libs/xapi'

interface ParentState {
  objectsByType?: ObjectsByType
}

interface State {
  hosts?: Map<string, Host>
  nRunningHosts?: number
  nRunningVms?: number
  vms?: Map<string, Vm>
}

interface Props {}

interface ParentEffects {}

interface Effects {}

interface Computed {}

const DEFAULT_STYLE = { m: 2 }

const Container = styled.div`
  display: flex;
  overflow: hidden;
  flex-direction: row;
  align-content: space-between;
  gap: 1.25em;
  background: '#E8E8E8';
`

const Panel = styled.div`
  background: #ffffff;
  border-radius: 0.5em;
  box-shadow: 0px 1px 1px 0px #00000014, 0px 2px 1px 0px #0000000f, 0px 1px 3px 0px #0000001a;
  margin: 0.5em;
`
const getHostPowerState = (host: Host) => {
  const { $metrics } = host
  return $metrics ? ($metrics.live ? 'Running' : 'Halted') : 'Unknown'
}

const Dashboard = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    computed: {
      hosts: state => state.objectsByType?.get('host'),
      vms: state =>
        state.objectsByType
          ?.get('VM')
          ?.filter((vm: Vm) => !vm.is_control_domain && !vm.is_a_snapshot && !vm.is_a_template),
      nRunningHosts: state => (state.hosts?.filter((host: Host) => getHostPowerState(host) === 'Running')).size,
      nRunningVms: state => (state.vms?.filter((vm: Vm) => vm.power_state === 'Running')).size,
    },
  },
  ({ state: { hosts, nRunningHosts, nRunningVms, vms } }) => (
    <Container>
      <Panel>
        <Typography variant='h4' component='div' sx={DEFAULT_STYLE}>
          <IntlMessage id='status' />
        </Typography>
        <ObjectStatus nActive={nRunningHosts} nTotal={hosts?.size} type='host' />
        <Divider variant='middle' sx={DEFAULT_STYLE} />
        <ObjectStatus nActive={nRunningVms} nTotal={vms?.size} type='VM' />
      </Panel>
    </Container>
  )
)

export default Dashboard
