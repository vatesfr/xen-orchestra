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
import { Input } from 'debounce-input-decorator'
import { InputCol, LabelCol, Row } from 'form-grid'
import { Select, Toggle } from 'form'
import map from 'lodash/map.js'
import { readCapacityAndGrainTable } from 'xo-vmdk-to-vhd'
import { SelectSr } from 'select-objects'
import { isSrWritableOrIso } from '../../common/xo'

// ===================================================================

const FROM_URL_FILE_TYPES = [
  {
    label: 'ISO',
    value: 'iso',
  },
]

// ===================================================================

const getInitialState = () => ({
  disks: [],
  fileType: FROM_URL_FILE_TYPES[0],
  isFromUrl: false,
  mapDescriptions: {},
  mapNames: {},
  sr: undefined,
  url: '',
  loadingDisks: false,
})

const FILE_GROUP_TYPE = {
  // .raw is supported for all types of SRs
  raw: ['.iso', '.raw'],
  other: ['.vmdk', '.vhd', '.raw'],
}

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
            const fileExtension = extIndex >= 0 ? name.slice(extIndex).toLowerCase() : undefined
            const isRaw = FILE_GROUP_TYPE.raw.includes(fileExtension)

            if (isRaw || FILE_GROUP_TYPE.other.includes(fileExtension)) {
              let vmdkData
              if (fileExtension === '.vmdk') {
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
                type: isRaw ? 'iso' : fileExtension.slice(1),
                vmdkData,
              }
            }
          })
        )
        return { disks: disks.filter(disk => disk !== undefined), loadingDisks: false }
      },
      importFromUrl:
        () =>
        async ({ fileType, mapDescriptions, mapNames, sr, url }) => {
          await importDisks(
            [
              {
                description: mapDescriptions.urlDescription?.trim(),
                name: mapNames.urlName.trim(),
                type: fileType.value,
                url,
              },
            ],
            sr
          )
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
      onChangeFileType: (_, fileType) => ({ fileType }),
      onChangeName:
        (_, { target: { name, value } }) =>
        ({ mapNames }) => ({
          mapNames: { ...mapNames, [name]: value },
        }),
      onChangeSr: (_, sr) => ({ sr }),
      onChangeUrl:
        (_, { target: { value } }) =>
        ({ mapNames }) => {
          mapNames.urlName = decodeURIComponent(value.slice(value.lastIndexOf('/') + 1))
          return {
            url: value,
            mapNames,
          }
        },
      toggleIsFromUrl: (_, isFromUrl) => ({ isFromUrl }),
      reset: getInitialState,
    },
    computed: {
      isSrIso: ({ sr }) => sr?.content_type === 'iso',
    },
  }),
  injectIntl,
  injectState,
  ({ effects, state: { disks, fileType, loadingDisks, mapDescriptions, mapNames, sr, isFromUrl, isSrIso, url } }) => (
    <Container>
      <form id='import-form'>
        <div className='mb-1'>
          <a
            className='text-info'
            href='https://xcp-ng.org/blog/2022/05/05/how-to-create-a-local-iso-repository-in-xcp-ng/'
            rel='noreferrer'
            target='_blank'
          >
            <Icon icon='info' /> {_('isoImportRequirement')}
          </a>
        </div>
        <Row>
          <Toggle className='align-middle' value={isFromUrl} onChange={effects.toggleIsFromUrl} /> {_('fromUrl')}
        </Row>
        <Row>
          <LabelCol>{_('importToSr')}</LabelCol>
          <InputCol>
            <SelectSr onChange={effects.onChangeSr} required value={sr} predicate={isSrWritableOrIso} />
          </InputCol>
        </Row>
        {sr !== undefined && (
          <div>
            {isFromUrl ? (
              !isSrIso ? (
                <p className='text-danger'>{_('UrlImportSrsCompatible')}</p>
              ) : (
                <div>
                  <Row>
                    <LabelCol>{_('url')}</LabelCol>
                    <InputCol>
                      <Input
                        className='form-control'
                        name='url'
                        onChange={effects.onChangeUrl}
                        placeholder='https://my-company.net/vdi.iso'
                        type='url'
                        value={url}
                      />
                    </InputCol>
                  </Row>
                  <Row>
                    <LabelCol>{_('fileType')}</LabelCol>
                    <InputCol>
                      <Select
                        onChange={effects.onChangeFileType}
                        options={FROM_URL_FILE_TYPES}
                        required
                        value={fileType}
                      />
                    </InputCol>
                  </Row>
                  <Row>
                    <LabelCol>{_('name')}</LabelCol>
                    <InputCol>
                      <Input
                        className='form-control'
                        name='urlName'
                        onChange={effects.onChangeName}
                        type='text'
                        value={mapNames.urlName}
                      />
                    </InputCol>
                  </Row>
                  <Row>
                    <LabelCol>{_('description')}</LabelCol>
                    <InputCol>
                      <Input
                        className='form-control'
                        name='urlDescription'
                        onChange={effects.onChangeDescription}
                        type='text'
                        value={mapDescriptions.urlDescription}
                      />
                    </InputCol>
                  </Row>
                </div>
              )
            ) : (
              <Dropzone
                onDrop={effects.handleDrop}
                message={_('dropDisksFiles', { types: isSrIso ? ['ISO', 'RAW'] : ['VHD', 'VMDK', 'RAW'] })}
                accept={isSrIso ? FILE_GROUP_TYPE.raw : FILE_GROUP_TYPE.other}
              />
            )}
            {loadingDisks && <Icon icon='loading' />}
            {(disks.length > 0 || url.trim() !== '') && (
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
                    handler={isFromUrl ? effects.importFromUrl : effects.import}
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
