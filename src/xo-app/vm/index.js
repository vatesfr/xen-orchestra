import _ from 'messages'
import ActionBar from 'action-bar'
import React, { Component } from 'react'
import { Row, Col } from 'grid'
import { connectStore } from 'utils'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs'

// ===================================================================

const vmActionBarByState = {
  Running: ({ handlers, vm }) => (
    <ActionBar
      actions={[
        {
          label: 'stopVmLabel',
          handler: () => handlers.stopVm(vm.id)
        }
      ]}
    />
  ),
  Halted: ({ handlers, vm }) => (
    <ActionBar
      actions={[
        {
          label: 'startVmLabel',
          handler: () => handlers.startVm(vm.id)
        }
      ]}
    />
  )
}

const VmActionBar = ({
  vm,
  handlers
}) => {
  const ActionBar = vmActionBarByState[vm.power_state]

  if (!ActionBar) {
    return <p>No action bar for state {vm.power_state}</p>
  }

  return <ActionBar vm={vm} handlers={handlers} />
}

// ===================================================================

@connectStore((state, props) => {
  const { objects } = state
  const { id } = props.params

  const vm = objects[id]
  if (!vm) {
    return {}
  }

  return {
    container: objects[vm.$container],
    pool: objects[vm.$pool],
    vm
  }
})
export default class extends Component {
  render () {
    const {
      container,
      pool,
      vm
    } = this.props

    if (!vm) {
      return <h1>Loading…</h1>
    }

    return <div>
      <h1>{vm.name_label} - {container.name_label} ({pool.name_label})</h1>
      <p>{vm.name_description}</p>

      <VmActionBar vm={vm} handlers={this.props} />
      <Tabs>
        <TabList>
          <Tab>{_('generalTabName')}</Tab>
          <Tab>{_('statsTabName')}</Tab>
          <Tab>{_('consoleTabName')}</Tab>
          <Tab>{_('disksTabName', { disks: vm.$VBDs.length })}</Tab>
          <Tab>{_('networkTabName')}</Tab>
          <Tab>{_('snapshotsTabName')}</Tab>
          <Tab>{_('logsTabName')}</Tab>
          <Tab>{_('advancedTabName')}</Tab>
        </TabList>
        <TabPanel>
          <Row className='text-xs-center'>
            <Col size={3}>
              <h2>{vm.CPUs.number}x <i className='xo-icon-cpu fa-lg'></i></h2>
            </Col>
            <Col size={3}>
              { /* TODO: compute nicely RAM units */ }
              <h2>{vm.memory.size / 1073741824}GB <i className='xo-icon-memory fa-lg'></i></h2>
            </Col>
            <Col size={3}>
              { /* TODO: compute total disk usage */ }
              <h2>{vm.$VBDs.length}x <i className='xo-icon-disk fa-lg'></i></h2>
            </Col>
            <Col size={3}>
              <h2>{vm.VIFs.length}x <i className='xo-icon-network fa-lg'></i></h2>
            </Col>
          </Row>
          {vm.xenTools
            ? <Row className='text-xs-center'>
              <Col size={6}>
                <p>{vm.addresses['0/ip']}</p>
              </Col>
              <Col size={6}>
                <p>{vm.os_version.name}</p>
              </Col>
            </Row>
            : <Row className='text-xs-center'>
                <Col size={12}><em>No tools installed</em></Col>
              </Row>
          }
          <Row>
            <Col size={12}>
              { /* TODO: tag display component */ }
              <p className='text-xs-center'>Tags: </p>
            </Col>
          </Row>
        </TabPanel>
        <TabPanel>
          <h2>Hello from Bar</h2>
        </TabPanel>
        <TabPanel>
          <div className='col-md-6'>
            <p>{JSON.stringify(vm, null, 2)}</p>
          </div>
        </TabPanel>
      </Tabs>
    </div>
  }
}
