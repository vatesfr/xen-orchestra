import _ from 'intl'
import ActionButton from 'action-button'
import Button from 'button'
import Collapse from 'collapse'
import decorate from 'apply-decorators'
import Dropzone from 'dropzone'
import fromEvent from 'promise-toolbox/fromEvent'
import Icon from 'icon'
import React from 'react'
import { Container } from 'grid'
import { formatSize } from 'utils'
import { generateId, linkState } from 'reaclette-utils'
import { importDisks } from 'xo'
import { injectIntl } from 'react-intl'
import { injectState, provideState } from 'reaclette'
import { InputCol, LabelCol, Row } from 'form-grid'
import map from 'lodash/map.js'
import { readCapacityAndGrainTable } from 'xo-vmdk-to-vhd'
import { SelectSr } from 'select-objects'
import { isSrWritableOrIso } from '../../common/xo'

const getInitialState = () => ({
  disks: [],
  mapDescriptions: {},
  mapNames: {},
  sr: undefined,
  loadingDisks: false,
})

const DiskImport = decorate([
  provideState({
    initialState: getInitialState,
    effects: {
      handleDrop: async function (_, files) {
        this.state.loadingDisks = true
        const disks = await Promise.all(
          map(files, async file => {
            const { name } = file
            const extIndex = name.lastIndexOf('.')
            let type
            if (
              extIndex >= 0 &&
              (type = name.slice(extIndex + 1).toLowerCase()) &&
              (type === 'vmdk' || type === 'vhd' || type === 'iso')
            ) {
              let vmdkData
              if (type === 'vmdk') {
                const parsed = await readCapacityAndGrainTable(async (start, end) => {
                  /* global FileReader */
                  const reader = new FileReader()
                  reader.readAsArrayBuffer(file.slice(start, end))
                  return (await fromEvent(reader, 'loadend')).target.result
                })
                const table = await parsed.tablePromise
                vmdkData = {
                  grainLogicalAddressList: table.grainLogicalAddressList,
                  grainFileOffsetList: table.grainFileOffsetList,
                  capacity: parsed.capacityBytes,
                }
              }

              return {
                id: generateId(),
                file,
                name,
                sr: this.state.sr,
                type,
                vmdkData,
              }
            }
          })
        )
        return { disks: disks.filter(disk => disk !== undefined), loadingDisks: false }
      },
      import:
        () =>
        async ({ disks, mapDescriptions, mapNames, sr }) => {
          await importDisks(
            disks.map(({ id, name, ...disk }) => ({
              ...disk,
              name: mapNames[id] || name,
              description: mapDescriptions[id],
            })),
            sr
          )
        },
      linkState,
      onChangeDescription:
        (_, { target: { name, value } }) =>
        ({ mapDescriptions }) => {
          mapDescriptions[name] = value
          return { mapDescriptions }
        },
      onChangeName:
        (_, { target: { name, value } }) =>
        ({ mapNames }) => {
          mapNames[name] = value
          return { mapNames }
        },
      onChangeSr: (_, sr) => ({ sr }),
      reset: getInitialState,
    },
  }),
  injectIntl,
  injectState,
  ({ effects, state: { disks, loadingDisks, mapDescriptions, mapNames, sr } }) => (
    <Container>
      <form id='import-form'>
        <Row>
          <LabelCol>{_('importToSr')}</LabelCol>
          <InputCol>
            <SelectSr onChange={effects.onChangeSr} required value={sr} predicate={isSrWritableOrIso} />
          </InputCol>
        </Row>
        {sr !== undefined && (
          <div>
            <Dropzone
              onDrop={effects.handleDrop}
              message={_('dropDisksFiles')}
              accept={sr.content_type === 'iso' ? '.iso' : ['.vhd', '.vmdk']}
            />
            {loadingDisks && <Icon icon='loading' />}
            {disks.length > 0 && (
              <div>
                <div>
                  {disks.map(({ file: { name, size }, id }) => (
                    <Collapse buttonText={`${name} - ${formatSize(size)}`} key={id} size='small' className='mb-1'>
                      <div className='mt-1'>
                        <Row>
                          <LabelCol>{_('formName')}</LabelCol>
                          <InputCol>
                            <input
                              className='form-control'
                              name={id}
                              onChange={effects.onChangeName}
                              placeholder={name}
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
                    handler={effects.import}
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
    </Container>
  ),
])
export { DiskImport as default }
