import _ from 'intl'
import decorate from 'apply-decorators'
import React from 'react'
import { Col, Row } from 'grid'
import { connectStore, formatSize } from 'utils'
import { createFinder, createGetObject, createGetObjectsOfType, createSelector } from 'selectors'
import { injectState, provideState } from 'reaclette'
import { map } from 'lodash'
import { SelectNetwork } from 'select-objects'
import { SizeInput } from 'form'

const VmData = decorate([
  connectStore(() => {
    const getHostMaster = createGetObject((_, props) => props.pool.master)
    const getPifs = createGetObjectsOfType('PIF').pick((state, props) => getHostMaster(state, props).$PIFs)
    const getDefaultNetworkId = createSelector(createFinder(getPifs, [pif => pif.management]), pif => pif.$network)

    return {
      defaultNetwork: getDefaultNetworkId,
    }
  }),
  provideState({
    effects: {
      onChangeDisks(_, { target: { name, value } }) {
        const { onChange, data: prevValue } = this.props
        // name: nameLabel-index or descriptionLabel-index
        const data = name.split('-')
        const index = data[1]
        onChange({
          ...prevValue,
          disks: {
            ...prevValue.disks,
            [index]: { ...prevValue.disks[index], [data[0]]: value },
          },
        })
      },
      onChangeMemory(_, memory) {
        const { onChange, data: prevData } = this.props
        onChange({
          ...prevData,
          memory,
        })
      },
      onChangeNCpus(_, { target: { value } }) {
        const { onChange, data: prevData } = this.props
        onChange({
          ...prevData,
          nCpus: +value,
        })
      },
      onChangeNetworks(_, network, networkIndex) {
        const { onChange, data } = this.props
        onChange({
          ...data,
          networks: data.networks.map((prevNetwork, index) => (index === networkIndex ? network.id : prevNetwork)),
        })
      },
      onChangeValue(_, { target: { name, value } }) {
        const { onChange, data } = this.props
        onChange({
          ...data,
          [name]: value,
        })
      },
    },
    computed: {
      networkPredicate:
        (_, { pool }) =>
        network =>
          pool.id === network.$pool,
    },
  }),
  injectState,
  ({
    data,
    defaultNetwork,
    effects: { onChangeDisks, onChangeMemory, onChangeNCpus, onChangeNetworks, onChangeValue },
    state: { networkPredicate },
  }) => (
    <div>
      <Row>
        <Col mediumSize={6}>
          <div className='form-group'>
            <label>{_('vmNameLabel')}</label>
            <input
              className='form-control'
              name='nameLabel'
              onChange={onChangeValue}
              type='text'
              required
              value={data.nameLabel}
            />
          </div>
          <div className='form-group'>
            <label>{_('vmNameDescription')}</label>
            <input
              className='form-control'
              name='descriptionLabel'
              onChange={onChangeValue}
              type='text'
              value={data.descriptionLabel}
            />
          </div>
        </Col>
        <Col mediumSize={6}>
          <div className='form-group'>
            <label>{_('nCpus')}</label>
            <input className='form-control' onChange={onChangeNCpus} type='number' required value={data.nCpus} />
          </div>
          <div className='form-group'>
            <label>{_('vmMemory')}</label>
            <SizeInput onChange={onChangeMemory} required value={data.memory} />
          </div>
        </Col>
      </Row>
      <Row>
        <Col mediumSize={6}>
          {map(data.disks, (disk, diskId) => (
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
                    name={`nameLabel-${diskId}`}
                    onChange={onChangeDisks}
                    type='text'
                    required
                    value={disk.nameLabel}
                  />
                </div>
              </Col>
              <Col mediumSize={6}>
                <div className='form-group'>
                  <label>{_('diskDescription')}</label>
                  <input
                    className='form-control'
                    name={`descriptionLabel-${diskId}`}
                    onChange={onChangeDisks}
                    type='text'
                    required
                    value={disk.descriptionLabel}
                  />
                </div>
              </Col>
            </Row>
          ))}
        </Col>
        <Col mediumSize={6}>
          {map(data.networks, (networkId, index) => (
            <div className='form-group' key={networkId}>
              <label>{_('networkInfo', { name: index + 1 })}</label>
              <SelectNetwork
                onChange={network => onChangeNetworks(network, index)}
                predicate={networkPredicate}
                value={data.networks[index] ?? defaultNetwork}
              />
            </div>
          ))}
        </Col>
      </Row>
      {data.storage !== undefined && (
        <Row className='mt-1'>
          <Col mediumSize={12}>
            <div className='form-group'>
              <label>{_('homeSrPage')}:</label>{' '}
              <span>
                {_('vmSrUsage', {
                  free: formatSize(data.storage.free),
                  total: formatSize(data.storage.used + data.storage.free),
                  used: formatSize(data.storage.used),
                })}
              </span>
            </div>
          </Col>
        </Row>
      )}
    </div>
  ),
])

export default VmData
