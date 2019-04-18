import _, { messages } from 'intl'
import ActionButton from 'action-button'
import Button from 'button'
import Collapse from 'collapse'
import decorate from 'apply-decorators'
import Dropzone from 'dropzone'
import fromEvent from 'promise-toolbox/fromEvent'
import React, { Component } from 'react'
import { formatSize, mapPlus } from 'utils'
import { generateId, linkState } from 'reaclette-utils'
import { importDisks } from 'xo'
import { injectIntl } from 'react-intl'
import { injectState, provideState } from 'reaclette'
import { LabelCol, InputCol, Row } from 'form-grid'
import { readCapacityAndGrainTable } from 'xo-vmdk-to-vhd'
import { SelectSr } from 'select-objects'

const getInitialState = () => ({
  disks: [],
  mapDescriptions: {},
  mapNames: {},
  sr: undefined,
})

const DiskImport = decorate([
  provideState({
    initialState: getInitialState,
    effects: {
      handleDrop: (effects, files) => async ({ sr }) => {
        const disks = await Promise.all(
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
                const parsed = await effects.parseVmdk(file)
                vmdkData = {
                  blocksTable: await parsed.tablePromise,
                  capacity: parsed.capacityBytes,
                }
              }
              push({
                id: generateId(),
                file,
                name,
                sr,
                type,
                vmdkData,
              })
            }
          })
        )
        return { disks }
      },
      linkState,
      onChangeDescription: (_, { target: { name, value } }) => ({
        mapDescriptions,
      }) => {
        mapDescriptions[name] = value
        return { mapDescriptions }
      },
      onChangeName: (_, { target: { name, value } }) => ({ mapNames }) => {
        mapNames[name] = value
        return { mapNames }
      },
      onChangeSr: (_, sr) => ({ sr }),
      parseVmdk: async file =>
        readCapacityAndGrainTable(async (start, end) => {
          /* global FileReader */
          const reader = new FileReader()
          reader.readAsArrayBuffer(file.slice(start, end))
          return (await fromEvent(reader, 'loadend')).target.result
        }),
      reset: getInitialState,
    },
  }),
  injectIntl,
  injectState,
  class extends Component {
    _import = () => {
      const {
        state: { disks, mapDescriptions, mapNames, sr },
      } = this.props
      return importDisks(
        disks.map(disk => {
          const { id, name } = disk
          return {
            ...disk,
            name: mapNames[id] || name,
            description: mapDescriptions[id],
          }
        }),
        sr
      )
    }

    render() {
      const {
        effects,
        intl: { formatMessage },
        state: { disks, mapDescriptions, mapNames, sr },
      } = this.props
      return (
        <form id='import-form'>
          <Row>
            <LabelCol>{_('importToSr')}</LabelCol>
            <InputCol>
              <SelectSr onChange={effects.onChangeSr} required value={sr} />
            </InputCol>
          </Row>
          {sr !== undefined && (
            <div>
              <Dropzone
                onDrop={effects.handleDrop}
                message={_('dropDisksFiles')}
              />
              {disks.length > 0 && (
                <div>
                  <div>
                    {disks.map(({ file: { name, preview, size }, id }) => (
                      <Collapse
                        buttonText={`${name} - ${formatSize(size)}`}
                        size='small'
                        className='mb-1'
                      >
                        <br />
                        <div key={preview}>
                          <Row>
                            <LabelCol>{_('formName')}</LabelCol>
                            <InputCol>
                              <input
                                className='form-control'
                                name={id}
                                onChange={effects.onChangeName}
                                placeholder={formatMessage(
                                  messages.diskNamePlaceholder
                                )}
                                type='text'
                                value={mapNames[id]}
                              />
                            </InputCol>
                          </Row>
                          <Row>
                            <LabelCol>{_('formDescription')}</LabelCol>
                            <InputCol>
                              <input
                                className='form-control'
                                name={id}
                                onChange={effects.onChangeDescription}
                                type='text'
                                value={mapDescriptions[id]}
                              />
                            </InputCol>
                          </Row>
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
                      redirectOnSuccess={`/srs/${sr.id}/disks`}
                      type='submit'
                    >
                      {_('newImport')}
                    </ActionButton>
                    <Button onClick={effects.reset}>{_('formReset')}</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
      )
    }
  },
])
export { DiskImport as default }
