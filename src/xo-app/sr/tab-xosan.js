import map from 'lodash/map'
import fromPairs from 'lodash/fromPairs'
import React, { Component } from 'react'
import { Container } from 'grid'
import { connectStore } from 'utils'
import {
  createGetObjectsOfType
} from 'selectors'
import {
  getPeers,
  getVolumeInfo
} from 'xo'

@connectStore(() => {
  return { allVMs: createGetObjectsOfType('VM'), allNetworks: createGetObjectsOfType('network') }
})
export default class TabXosan extends Component {
  constructor (props) {
    super(props)
    this.state = {
      peers: null,
      volumes: null
    }
  }

  componentDidMount () {
    const pbds = Object.values(this.props.pbds)
    Promise.all(map(pbds, pbd => getPeers(pbd.device_config['server'].split(':/')[0])))
      .then(pools => {
        this.setState({
          peers: fromPairs(pools.map((pool, index) => [pbds[index].id, pool]))
        })
      })
    Promise.all(map(pbds, pbd => getVolumeInfo.apply(null, pbd.device_config['server'].split(':/'))))
      .then(pools => {
        this.setState({ volumes: fromPairs(pools.map((pool, index) => [pbds[index].id, pool])) })
      })
  }

  render () {
    return <Container>
      Connections:
      <table className='table table-striped'>
        <thead>
          <tr>
            <th>Host</th>
            <th>Config</th>
            <th>SAN VM</th>
            <th>XO SAN POOL</th>
            <th>XO SAN Volume ID</th>
          </tr>
        </thead>
        <tbody>
          {
            map(this.props.pbds, pbd => {
              const xosanServerAddress = pbd.device_config['server'].split(':')[0]

              let xosanVM = null
              for (let vm of Object.values(this.props.allVMs)) {
                if (vm.addresses && Object.values(vm.addresses).includes(xosanServerAddress)) {
                  xosanVM = vm
                  break
                }
              }
              return <tr>
                <td>{this.props.hosts[pbd.host].name_label}</td>
                <td>{pbd.device_config['server']} - {pbd.device_config['backupserver']}</td>
                <td>{xosanVM.name_label}</td>
                <td>{this.state.peers &&
                  <ul>{map(this.state.peers[pbd.id], peer => <li key={peer.uuid}>{peer.hostname}
                    - {peer.state}</li>)}</ul> }
                </td>
                <td>
                  {this.state.volumes && this.state.volumes[pbd.id]['Volume ID']}
                </td>
              </tr>
            }
            )}
        </tbody>
      </table>
    </Container >
  }
}
