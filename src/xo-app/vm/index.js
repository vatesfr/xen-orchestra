import _ from 'messages'
import React, { Component } from 'react'
import xo from 'xo'
import { Row, Col } from 'grid'
import { connectStore, osFamily, formatSize } from 'utils'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs'
import VmActionBar from './action-bar'

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
  componentWillMount () {
    xo.call('vm.stats', { id: this.props.params.id }).then((stats) => {
      this.setState({ stats })
    })
  }

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
      <Row>
        <Col size={6}>
          <h1>{vm.name_label} <small>- {container.name_label} ({pool.name_label})</small></h1>
          <p>{vm.name_description}</p>
        </Col>
        <Col size={6}>
          <VmActionBar vm={vm} handlers={this.props} />
        </Col>
      </Row>
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
          { /* TODO: use CSS style */ }
          <br/>
          <Row className='text-xs-center'>
            <Col size={3}>
              <h2>{vm.CPUs.number}x <i className='xo-icon-cpu fa-lg'></i></h2>
            </Col>
            <Col size={3}>
              { /* TODO: compute nicely RAM units */ }
              <h2>{formatSize(vm.memory.size)} <i className='xo-icon-memory fa-lg'></i></h2>
            </Col>
            <Col size={3}>
              { /* TODO: compute total disk usage */ }
              <h2>{vm.$VBDs.length}x <i className='xo-icon-disk fa-lg'></i></h2>
            </Col>
            <Col size={3}>
              <h2>{vm.VIFs.length}x <i className='xo-icon-network fa-lg'></i></h2>
            </Col>
          </Row>
          { /* TODO: use CSS style */ }
          <br/>
          {vm.xenTools
            ? <Row className='text-xs-center'>
              <Col size={6}>
                { /* TODO: check this syntax */ }
                <p>{vm.addresses['0/ip'] ? <pre>{vm.addresses['0/ip']}</pre> : <pre>{'No IPv4 record.'}</pre>}</p>
              </Col>
              <Col size={6}>
                { /* TODO: tooltip and better icon usage */ }
                <h1><i className={'icon-' + osFamily(vm.os_version.distro)} /></h1>
              </Col>
            </Row>
            : <Row className='text-xs-center'>
              <Col size={12}><em>No tools installed</em></Col>
            </Row>
          }
          { /* TODO: use CSS style */ }
          <br/>
          <Row>
            <Col size={12}>
              { /* TODO: tag display component */ }
              <p className='text-xs-center'>Tags: </p>
            </Col>
          </Row>
        </TabPanel>
        <TabPanel>
          <pre>{JSON.stringify(this.state, null, 2)}</pre>
        </TabPanel>
        <TabPanel>
          <h2>Hello from Bar</h2>
        </TabPanel>
        <TabPanel>
          <div className='col-md-6'>
            <pre>{JSON.stringify(vm, null, 2)}</pre>
          </div>
        </TabPanel>
      </Tabs>
    </div>
  }
}
