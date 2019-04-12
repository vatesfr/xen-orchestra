import * as FormGrid from 'form-grid'
import _ from 'intl'
import ActionButton from 'action-button'
import Button from 'button'
import Collapse from 'collapse'
import Component from 'base-component'
import Dropzone from 'dropzone'
import fromEvent from 'promise-toolbox/fromEvent'
import React from 'react'
import { formatSize, mapPlus } from 'utils'
import { importDisks } from 'xo'
import { readCapacityAndGrainTable } from 'xo-vmdk-to-vhd'
import { SelectSr } from 'select-objects'

export default class DiskImport extends Component {
  state = { disks: [], mapDescriptions: [], mapNames: [] }

  // global FileReader
  async _parseVmdk(file) {
    return readCapacityAndGrainTable(async (start, end) => {
      const reader = new FileReader()
      reader.readAsArrayBuffer(file.slice(start, end))
      return (await fromEvent(reader, 'loadend')).target.result
    })
  }

  // eslint-disable no-console
  _handleDrop = async files => {
    const disks = []
    await Promise.all(
      mapPlus(files, async (file, push) => {
        const { name } = file
        const extIndex = name.lastIndexOf('.')
        let type
        if (
          extIndex >= 0 &&
          (type = name.slice(extIndex + 1)) &&
          (type === 'vmdk' || type === 'vhd')
        ) {
          let vmdkData
          if (type === 'vmdk') {
            const parsed = await this._parseVmdk(file)
            vmdkData = {
              blocksTable: await parsed.tablePromise,
              capacity: parsed.capacityBytes,
            }
          }
          disks.push({
            file,
            name,
            sr: this.state.sr,
            type,
            vmdkData,
          })
        }
      })
    )
    this.setState({ disks })
  }

  _import = () => {
    const { disks, mapDescriptions, mapNames, sr } = this.state
    return importDisks(
      disks.map((disk, index) => ({
        ...disk,
        name: mapNames[index] || disk.name,
        description: mapDescriptions[index],
      })),
      sr
    )
  }

  _reset = () =>
    this.setState({
      mapDescriptions: undefined,
      disks: [],
      mapNames: undefined,
      sr: undefined,
    })

  _redirectOnSuccess = () => `/srs/${this.state.sr.id}/disks`

  render() {
    const { mapDescriptions, mapNames, sr, disks } = this.state
    return (
      <form id='import-form'>
        <FormGrid.Row>
          <FormGrid.LabelCol>{_('importToSr')}</FormGrid.LabelCol>
          <FormGrid.InputCol>
            <SelectSr onChange={this.linkState('sr')} required value={sr} />
          </FormGrid.InputCol>
        </FormGrid.Row>
        {sr !== undefined && (
          <div>
            <Dropzone
              onDrop={this._handleDrop}
              message={_('importDisksList')}
            />
            {disks.length > 0 && (
              <div>
                <div>
                  {disks.map(({ file: { name, preview, size } }, diskIndex) => (
                    <Collapse
                      buttonText={`${name} - ${formatSize(size)}`}
                      size='small'
                      className='mb-1'
                    >
                      <br />
                      <div key={preview}>
                        <FormGrid.Row>
                          <FormGrid.LabelCol>{_('formName')}</FormGrid.LabelCol>
                          <FormGrid.InputCol>
                            <input
                              className='form-control'
                              onChange={this.linkState(`mapNames.${diskIndex}`)}
                              type='text'
                              value={mapNames[diskIndex] || name}
                            />
                          </FormGrid.InputCol>
                        </FormGrid.Row>
                        <FormGrid.Row>
                          <FormGrid.LabelCol>
                            {_('formDescription')}
                          </FormGrid.LabelCol>
                          <FormGrid.InputCol>
                            <input
                              className='form-control'
                              onChange={this.linkState(
                                `mapDescriptions.${diskIndex}`
                              )}
                              type='text'
                              value={mapDescriptions[diskIndex]}
                            />
                          </FormGrid.InputCol>
                        </FormGrid.Row>
                      </div>
                    </Collapse>
                  ))}
                </div>
                <div className='form-group pull-right'>
                  <ActionButton
                    btnStyle='primary'
                    className='mr-1'
                    form='import-form'
                    handler={this._import}
                    icon='import'
                    redirectOnSuccess={this._redirectOnSuccess}
                    type='submit'
                  >
                    {_('newImport')}
                  </ActionButton>
                  <Button onClick={this._reset}>{_('formReset')}</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </form>
    )
  }
}
