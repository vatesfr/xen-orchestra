import _ from 'intl'
import Component from 'base-component'
import PropTypes from 'prop-types'
import React from 'react'
import { Col, Row } from 'grid'
import { connectStore, formatSize } from 'utils'
import { createFinder, createGetObject, createGetObjectsOfType, createSelector } from 'selectors'
import { isEmpty, map } from 'lodash'
import { SelectNetwork } from 'select-objects'
import { SizeInput } from 'form'

@connectStore(
  () => {
    const getHostMaster = createGetObject((_, props) => props.pool.master)
    const getPifs = createGetObjectsOfType('PIF').pick((state, props) => getHostMaster(state, props).$PIFs)
    const getDefaultNetworkId = createSelector(createFinder(getPifs, [pif => pif.management]), pif => pif.$network)

    return {
      defaultNetwork: getDefaultNetworkId,
    }
  },
  { withRef: true }
)
class VmData extends Component {
  static propTypes = {
    descriptionLabel: PropTypes.string,
    disks: PropTypes.objectOf(
      PropTypes.shape({
        capacity: PropTypes.number.isRequired,
        descriptionLabel: PropTypes.string.isRequired,
        nameLabel: PropTypes.string.isRequired,
        path: PropTypes.string.isRequired,
        compression: PropTypes.string,
      })
    ),
    memory: PropTypes.number,
    nameLabel: PropTypes.string,
    nCpus: PropTypes.number,
    networks: PropTypes.array,
    pool: PropTypes.object.isRequired,
  }

  get value() {
    const { props, refs } = this
    return {
      descriptionLabel: refs.descriptionLabel.value,
      disks: map(props.disks, ({ capacity, path, compression, position }, diskId) => ({
        capacity,
        descriptionLabel: refs[`disk-description-${diskId}`].value,
        nameLabel: refs[`disk-name-${diskId}`].value,
        path,
        position,
        compression,
      })),
      memory: +refs.memory.value,
      nameLabel: refs.nameLabel.value,
      networks: map(props.networks, (_, networkId) => {
        const network = refs[`network-${networkId}`].value
        return network.id ? network.id : network
      }),
      nCpus: +refs.nCpus.value,
      tables: props.tables,
    }
  }

  _getNetworkPredicate = createSelector(
    () => this.props.pool.id,
    id => network => network.$pool === id
  )

  render() {
    const { descriptionLabel, defaultNetwork, disks, memory, nameLabel, nCpus, networks } = this.props

    return (
      <div>
        <Row>
          <Col mediumSize={6}>
            <div className='form-group'>
              <label>{_('vmNameLabel')}</label>
              <input className='form-control' ref='nameLabel' defaultValue={nameLabel} type='text' required />
            </div>
            <div className='form-group'>
              <label>{_('vmNameDescription')}</label>
              <input className='form-control' ref='descriptionLabel' defaultValue={descriptionLabel} type='text' />
            </div>
          </Col>
          <Col mediumSize={6}>
            <div className='form-group'>
              <label>{_('nCpus')}</label>
              <input className='form-control' ref='nCpus' defaultValue={nCpus} type='number' required />
            </div>
            <div className='form-group'>
              <label>{_('vmMemory')}</label>
              <SizeInput defaultValue={memory} ref='memory' required />
            </div>
          </Col>
        </Row>
        <Row>
          <Col mediumSize={6}>
            {!isEmpty(disks)
              ? map(disks, (disk, diskId) => (
                  <Row key={diskId}>
                    <Col mediumSize={6}>
                      <div className='form-group'>
                        <label>
                          {_('diskInfo', {
                            position: `${disk.position}`,
                            capacity: formatSize(disk.capacity),
                          })}
                        </label>
                        <input
                          className='form-control'
                          ref={`disk-name-${diskId}`}
                          defaultValue={disk.nameLabel}
                          type='text'
                          required
                        />
                      </div>
                    </Col>
                    <Col mediumSize={6}>
                      <div className='form-group'>
                        <label>{_('diskDescription')}</label>
                        <input
                          className='form-control'
                          ref={`disk-description-${diskId}`}
                          defaultValue={disk.descriptionLabel}
                          type='text'
                          required
                        />
                      </div>
                    </Col>
                  </Row>
                ))
              : _('noDisks')}
          </Col>
          <Col mediumSize={6}>
            {networks.length > 0
              ? map(networks, (name, networkId) => (
                  <div className='form-group' key={networkId}>
                    <label>{_('networkInfo', { name })}</label>
                    <SelectNetwork
                      defaultValue={defaultNetwork}
                      ref={`network-${networkId}`}
                      predicate={this._getNetworkPredicate()}
                    />
                  </div>
                ))
              : _('noNetworks')}
          </Col>
        </Row>
      </div>
    )
  }
}

export default VmData
