import _ from 'intl'
import Component from 'base-component'
import Icon from 'icon'
import map from 'lodash/map'
import Page from '../page'
import React from 'react'
import Tooltip from 'tooltip'
import { connectStore, formatSize } from 'utils'
import { Container } from 'grid'
import {
  createGetObjectsOfType,
  createSelector,
  createSort
} from 'selectors'

const HEADER = <Container>
  <h2><Icon icon='menu-update' /> Xen Orchestra Storage Area Network</h2>
</Container>

@connectStore(() => {
  const srs = createSort(createSelector(
    createGetObjectsOfType('SR').filter([sr => !sr.shared && sr.SR_type === 'lvm']),
    createGetObjectsOfType('PBD').groupBy('SR'),
    createGetObjectsOfType('host'),
    (srs, pbds, hosts) => map(srs, sr => {
      const list = pbds[sr.id]
      sr.PBDs = list || []
      sr.PBDs.forEach(pbd => {
        pbd.realHost = hosts[pbd.host]
      })
      sr.PBDs.sort()
      return sr
    })
  ), 'name_label')

  const xosansrs = createSort(createSelector(
    createGetObjectsOfType('SR').filter([sr => sr.shared && sr.SR_type === 'xosan']),
    createGetObjectsOfType('PBD').groupBy('SR'),
    createGetObjectsOfType('host'),
    (srs, pbds, hosts) => map(srs, sr => {
      const list = pbds[sr.id]
      sr.PBDs = list || []
      sr.PBDs.forEach(pbd => {
        pbd.realHost = hosts[pbd.host]
      })
      sr.PBDs.sort((pbd1, pbd2) => pbd1.realHost.name_label.localeCompare(pbd2.realHost.name_label))
      return sr
    })
  ), 'name_label')
  return {
    xosansrs,
    srs
  }
})
export default class Xosan extends Component {
  render () {
    const {xosansrs, srs} = this.props
    return <Page header={HEADER} title='xosan' formatTitle>
      <Container>
        <h1>Xen Orchestra SAN Volumes</h1>
        <table className='table table-striped'>
          <thead>
            <tr>
              <th>Name</th>
              <th>Hosts</th>
              <th>Size</th>
              <th>Used Space</th>
            </tr>
          </thead>
          <tbody>
            {map(xosansrs, sr => {
              return <tr key={sr.id}>
                <td>
                  {sr.name_label}
                </td>
                <td>
                  { sr.PBDs.map(pbd => pbd.realHost.name_label).join(', ') }
                </td>
                <td>
                  {formatSize(sr.size)}
                </td>
                <td>
                  {sr.size > 0 &&
                  <Tooltip content={_('spaceLeftTooltip', {
                    used: String(Math.round((sr.physical_usage / sr.size) * 100)),
                    free: formatSize(sr.size - sr.physical_usage)
                  })}>
                    <progress style={{margin: 0}} className='progress' value={(sr.physical_usage / sr.size) * 100}
                      max='100' />
                  </Tooltip>
                }
                </td>
              </tr>
            })}
          </tbody>
        </table>
        <h1>Available Raw Disks</h1>
        <table className='table table-striped'>
          <thead>
            <tr>
              <th>Name</th>
              <th>Hosts</th>
              <th>Size</th>
              <th>Used Space</th>
            </tr>
          </thead>
          <tbody>
            {map(srs, sr => {
              return <tr key={sr.id}>
                <td>
                  {sr.name_label}
                </td>
                <td>
                  { sr.PBDs.map(pbd => pbd.realHost.name_label).join(', ') }
                </td>
                <td>
                  {formatSize(sr.size)}
                </td>
                <td>
                  {sr.size > 0 &&
                  <Tooltip content={_('spaceLeftTooltip', {
                    used: String(Math.round((sr.physical_usage / sr.size) * 100)),
                    free: formatSize(sr.size - sr.physical_usage)
                  })}>
                    <progress style={{margin: 0}} className='progress' value={(sr.physical_usage / sr.size) * 100}
                      max='100' />
                  </Tooltip>
                }
                </td>
              </tr>
            })}
          </tbody>
        </table>
      </Container>
    </Page>
  }
}
