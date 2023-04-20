import * as FormGrid from 'form-grid'
import _ from 'intl'
import ActionButton from 'action-button'
import Button from 'button'
import Component from 'base-component'
import Dropzone from 'dropzone'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import orderBy from 'lodash/orderBy'
import PropTypes from 'prop-types'
import React from 'react'
import { Container, Col, Row } from 'grid'
import { importVm, importVms, isSrWritable } from 'xo'
import { Select, SizeInput, Toggle } from 'form'
import { createFinder, createGetObject, createGetObjectsOfType, createSelector } from 'selectors'
import { connectStore, formatSize, mapPlus, noop } from 'utils'
import { Input } from 'debounce-input-decorator'

import { SelectNetwork, SelectPool, SelectSr } from 'select-objects'

import parseOvaFile from './ova'

import styles from './index.css'
import { getRedirectionUrl } from './utils'

// ===================================================================

const FILE_TYPES = [
  {
    label: 'XVA',
    value: 'xva',
  },
]

const FORMAT_TO_HANDLER = {
  ova: parseOvaFile,
  xva: noop,
}

// ===================================================================

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

// ===================================================================

const parseFile = async (file, type, func) => {
  try {
    return {
      data: await func(file),
      file,
      type,
    }
  } catch (error) {
    console.error(error)
    return { error, file, type }
  }
}

export default class Import extends Component {
  constructor(props) {
    super(props)
    this.state = {
      isFromUrl: false,
      type: {
        label: 'XVA',
        value: 'xva',
      },
      url: '',
      vms: [],
    }
  }

  _import = () => {
    const { state } = this
    return importVms(
      mapPlus(state.vms, (vm, push, vmIndex) => {
        if (!vm.error) {
          const ref = this.refs[`vm-data-${vmIndex}`]
          push({
            ...vm,
            data: ref && ref.value,
          })
        }
      }),
      state.sr
    )
  }

  _importVmFromUrl = () => {
    const { type, url } = this.state
    const file = {
      name: decodeURIComponent(url.slice(url.lastIndexOf('/') + 1)),
    }
    return importVm(file, type.value, undefined, this.state.sr, url)
  }

  _handleDrop = async files => {
    this.setState({
      vms: [],
    })

    const vms = await Promise.all(
      mapPlus(files, (file, push) => {
        const { name } = file
        const extIndex = name.lastIndexOf('.')

        let func
        let type

        if (extIndex >= 0 && (type = name.slice(extIndex + 1).toLowerCase()) && (func = FORMAT_TO_HANDLER[type])) {
          push(parseFile(file, type, func))
        }
      })
    )

    this.setState({
      vms: orderBy(vms, vm => [vm.error != null, vm.type, vm.file.name]),
    })
  }

  _handleCleanSelectedVms = () => {
    this.setState({
      vms: [],
    })
  }

  _handleSelectedPool = pool => {
    if (pool === '') {
      this.setState({
        pool: undefined,
        sr: undefined,
        srPredicate: undefined,
      })
    } else {
      this.setState({
        pool,
        sr: pool.default_SR,
        srPredicate: sr => sr.$pool === this.state.pool.id && isSrWritable(sr),
      })
    }
  }

  _handleSelectedSr = sr => {
    this.setState({
      sr: sr === '' ? undefined : sr,
    })
  }

  render() {
    const { isFromUrl, pool, sr, srPredicate, type, url, vms } = this.state

    return (
      <Container>
        <form id='import-form'>
          <p>
            <Toggle value={isFromUrl} onChange={this.toggleState('isFromUrl')} /> {_('fromUrl')}
          </p>
          <FormGrid.Row>
            <FormGrid.LabelCol>{_('vmImportToPool')}</FormGrid.LabelCol>
            <FormGrid.InputCol>
              <SelectPool value={pool} onChange={this._handleSelectedPool} required />
            </FormGrid.InputCol>
          </FormGrid.Row>
          <FormGrid.Row>
            <FormGrid.LabelCol>{_('vmImportToSr')}</FormGrid.LabelCol>
            <FormGrid.InputCol>
              <SelectSr
                disabled={!pool}
                onChange={this._handleSelectedSr}
                predicate={srPredicate}
                required
                value={sr}
              />
            </FormGrid.InputCol>
          </FormGrid.Row>
          {sr &&
            (!isFromUrl ? (
              <div>
                <Dropzone onDrop={this._handleDrop} message={_('importVmsList')} />
                <hr />
                <h5>{_('vmsToImport', { nVms: vms.length })}</h5>
                {vms.length > 0 ? (
                  <div>
                    {map(vms, ({ data, error, file, type }, vmIndex) => (
                      <div key={file.preview} className={styles.vmContainer}>
                        <strong>{file.name}</strong>
                        <span className='pull-right'>
                          <strong>{`(${formatSize(file.size)})`}</strong>
                        </span>
                        {!error ? (
                          data && (
                            <div>
                              <hr />
                              <div className='alert alert-info' role='alert'>
                                <strong>{_('vmImportFileType', { type })}</strong> {_('vmImportConfigAlert')}
                              </div>
                              <VmData {...data} ref={`vm-data-${vmIndex}`} pool={pool} />
                            </div>
                          )
                        ) : (
                          <div>
                            <hr />
                            <div className='alert alert-danger' role='alert'>
                              <strong>{_('vmImportError')}</strong>{' '}
                              {(error && error.message) || _('noVmImportErrorDescription')}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>{_('noSelectedVms')}</p>
                )}
                <hr />
                <div className='form-group pull-right'>
                  <ActionButton
                    btnStyle='primary'
                    disabled={!vms.length}
                    className='mr-1'
                    form='import-form'
                    handler={this._import}
                    icon='import'
                    redirectOnSuccess={getRedirectionUrl}
                    type='submit'
                  >
                    {_('newImport')}
                  </ActionButton>
                  <Button onClick={this._handleCleanSelectedVms}>{_('importVmsCleanList')}</Button>
                </div>
              </div>
            ) : (
              <div>
                <FormGrid.Row>
                  <FormGrid.LabelCol>{_('url')}</FormGrid.LabelCol>
                  <FormGrid.InputCol>
                    <Input
                      className='form-control'
                      onChange={this.linkState('url')}
                      placeholder='https://my-company.net/vm.xva'
                      type='url'
                    />
                  </FormGrid.InputCol>
                </FormGrid.Row>
                <FormGrid.Row>
                  <FormGrid.LabelCol>{_('fileType')}</FormGrid.LabelCol>
                  <FormGrid.InputCol>
                    <Select onChange={this.linkState('type')} options={FILE_TYPES} required value={type} />
                  </FormGrid.InputCol>
                </FormGrid.Row>
                <ActionButton
                  btnStyle='primary'
                  className='mr-1 mt-1'
                  disabled={isEmpty(url)}
                  form='import-form'
                  handler={this._importVmFromUrl}
                  icon='import'
                  redirectOnSuccess={getRedirectionUrl}
                  type='submit'
                >
                  {_('newImport')}
                </ActionButton>
              </div>
            ))}
        </form>
      </Container>
    )
  }
}
