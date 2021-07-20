import _ from 'intl'
import ActionButton from 'action-button'
import ButtonGroup from 'button-group'
import Component from 'base-component'
import defined from '@xen-orchestra/defined'
import Icon from 'icon'
import React from 'react'
import Select from 'form/select'
import Tooltip from 'tooltip'
import { dirname } from 'path'
import { Container, Col, Row } from 'grid'
import { createSelector } from 'reselect'
import { formatSize } from 'utils'
import { filter, find, forEach, includes, isEmpty, map } from 'lodash'
import { getRenderXoItemOfType } from 'render-xo-item'
import { listPartitions, listFiles } from 'xo'

// -----------------------------------------------------------------------------

const PARTITION_TYPE_NAMES = {
  0x07: 'NTFS',
  0x0c: 'FAT',
  0x83: 'LINUX',
}

const BACKUP_RENDERER = getRenderXoItemOfType('backup')

const diskOptionRenderer = disk => (
  <span>
    <Icon icon='disk' /> {disk.name}
  </span>
)

const partitionOptionRenderer = partition => (
  <span>
    {partition.name} {defined(PARTITION_TYPE_NAMES[partition.type], partition.type)}{' '}
    {partition.size && `(${formatSize(+partition.size)})`}
  </span>
)

const fileOptionRenderer = ({ isFile, name }) => (
  <span>
    <Icon icon={isFile ? 'file' : 'folder'} /> {name}
  </span>
)

const ensureTrailingSlash = path => path + (path.endsWith('/') ? '' : '/')

// -----------------------------------------------------------------------------

const formatFilesOptions = (rawFiles, path) => {
  const files =
    path !== '/'
      ? [
          {
            id: '..',
            isFile: false,
            name: '..',
            path: ensureTrailingSlash(dirname(path)),
          },
        ]
      : []

  return files.concat(
    map(rawFiles, (_, name) => ({
      id: `${path}${name}`,
      isFile: !name.endsWith('/'),
      name,
      path: `${path}${name}`,
    }))
  )
}

// -----------------------------------------------------------------------------

export default class RestoreFileModalBody extends Component {
  state = {
    selectedFiles: [],
  }

  get value() {
    const { disk, partition, selectedFiles, backup } = this.state
    const redundantFiles = this._getRedundantFiles()

    return {
      disk,
      partition,
      paths: map(
        selectedFiles.filter(({ path }) => !redundantFiles[path]),
        'path'
      ),
      remote: backup.remote.id,
    }
  }

  _listFiles = () => {
    const { backup, disk, partition, path } = this.state
    this.setState({ scanningFiles: true })

    return listFiles(backup.remote.id, disk, path, partition).then(
      rawFiles =>
        this.setState({
          files: formatFilesOptions(rawFiles, path),
          scanningFiles: false,
          listFilesError: false,
        }),
      error => {
        this.setState({
          scanningFiles: false,
          listFilesError: true,
        })
        throw error
      }
    )
  }

  _getSelectableFiles = createSelector(
    () => this.state.files,
    () => this.state.selectedFiles,
    (available, selected) => filter(available, file => !includes(selected, file))
  )

  _onBackupChange = backup => {
    this.setState({
      backup,
      disk: undefined,
      partition: undefined,
      partitions: undefined,
      file: undefined,
      selectedFiles: [],
      scanDiskError: false,
      listFilesError: false,
    })
  }

  _onDiskChange = disk => {
    this.setState({
      partition: undefined,
      partitions: undefined,
      file: undefined,
      selectedFiles: [],
      scanDiskError: false,
      listFilesError: false,
    })

    if (!disk) {
      return
    }

    listPartitions(this.state.backup.remote.id, disk).then(
      partitions => {
        if (isEmpty(partitions)) {
          this.setState(
            {
              disk,
              path: '/',
            },
            this._listFiles
          )

          return
        }

        this.setState({
          disk,
          partitions,
        })
      },
      error => {
        this.setState({
          disk,
          scanDiskError: true,
        })
        throw error
      }
    )
  }

  _onPartitionChange = partition => {
    this.setState(
      {
        partition,
        path: '/',
        file: undefined,
        selectedFiles: [],
      },
      partition && this._listFiles
    )
  }

  _onFileChange = file => {
    if (file == null) {
      return
    }

    // Ugly workaround to keep the ReactSelect open after selecting a folder
    // FIXME: Remove once something better is implemented in react-select:
    // https://github.com/JedWatson/react-select/issues/1989
    const select = document.activeElement
    select.blur()
    select.focus()

    if (file.isFile) {
      const { selectedFiles } = this.state
      if (!includes(selectedFiles, file)) {
        this.setState({
          selectedFiles: selectedFiles.concat(file),
        })
      }
    } else {
      this.setState(
        {
          path: file.path,
        },
        this._listFiles
      )
    }
  }

  _selectFolder = () => {
    const { selectedFiles, path } = this.state
    this.setState({
      selectedFiles: selectedFiles.concat({ id: path, path }),
    })
  }

  _getFolderAlreadySelected = createSelector(
    () => this.state.path,
    () => this.state.selectedFiles,
    (path, selectedFiles) => find(selectedFiles, { path }) !== undefined
  )

  _unselectFile = file => {
    this.setState({
      selectedFiles: filter(this.state.selectedFiles, ({ id }) => id !== file.id),
    })
  }

  _unselectAllFiles = () => {
    this.setState({
      selectedFiles: [],
    })
  }

  _selectAllFolderFiles = () => {
    this.setState({
      selectedFiles: this.state.selectedFiles.concat(filter(this._getSelectableFiles(), 'isFile')),
    })
  }

  _getRedundantFiles = createSelector(
    () => this.state.selectedFiles,
    files => {
      const redundantFiles = {}
      forEach(files, file => {
        redundantFiles[file.path] =
          find(files, f => !f.isFile && f !== file && file.path.startsWith(f.path)) !== undefined
      })
      return redundantFiles
    }
  )

  // ---------------------------------------------------------------------------

  render() {
    const { backups } = this.props
    const { backup, disk, partition, partitions, path, scanDiskError, listFilesError, scanningFiles, selectedFiles } =
      this.state
    const noPartitions = isEmpty(partitions)
    const redundantFiles = this._getRedundantFiles()

    return (
      <div>
        <Select
          labelKey='name'
          onChange={this._onBackupChange}
          optionRenderer={BACKUP_RENDERER}
          options={backups}
          placeholder={_('restoreFilesSelectBackup')}
          value={backup}
          valueKey='id'
        />
        {backup && [
          <br />,
          <Select
            labelKey='name'
            onChange={this._onDiskChange}
            optionRenderer={diskOptionRenderer}
            options={backup.disks}
            placeholder={_('restoreFilesSelectDisk')}
            value={disk}
            valueKey='id'
          />,
        ]}
        {scanDiskError && (
          <span>
            <Icon icon='error' /> {_('restoreFilesDiskError')}
          </span>
        )}
        {disk &&
          !scanDiskError &&
          !noPartitions && [
            <br />,
            <Select
              labelKey='name'
              onChange={this._onPartitionChange}
              optionRenderer={partitionOptionRenderer}
              options={partitions}
              placeholder={_('restoreFilesSelectPartition')}
              value={partition}
              valueKey='id'
            />,
          ]}
        {(partition || (disk && !scanDiskError && noPartitions)) && [
          <br />,
          <Container>
            <Row>
              <Col size={9}>
                <pre>
                  {path} {scanningFiles && <Icon icon='loading' />}
                  {listFilesError && <Icon icon='error' />}
                </pre>
              </Col>
              <Col size={3}>
                <span className='pull-right'>
                  <ButtonGroup>
                    <Tooltip content={_('restoreFilesSelectFolder')}>
                      <ActionButton
                        disabled={this._getFolderAlreadySelected()}
                        handler={this._selectFolder}
                        icon='folder'
                        size='small'
                      />
                    </Tooltip>
                    <Tooltip content={_('restoreFilesSelectAllFiles')}>
                      <ActionButton handler={this._selectAllFolderFiles} icon='files' size='small' />
                    </Tooltip>
                  </ButtonGroup>
                </span>
              </Col>
            </Row>
          </Container>,
          <Select
            labelKey='name'
            onChange={this._onFileChange}
            optionRenderer={fileOptionRenderer}
            options={this._getSelectableFiles()}
            placeholder={_('restoreFilesSelectFiles')}
            value={null}
            valueKey='id'
          />,
          <br />,
          selectedFiles.length ? (
            <Container>
              <Row>
                <Col className='pl-0 pb-1' size={10}>
                  <em>
                    {_('restoreFilesSelectedFilesAndFolders', {
                      files: selectedFiles.length,
                    })}
                  </em>
                </Col>
                <Col size={2} className='text-xs-right'>
                  <ActionButton
                    handler={this._unselectAllFiles}
                    icon='remove'
                    size='small'
                    tooltip={_('restoreFilesUnselectAll')}
                  />
                </Col>
              </Row>
              {map(selectedFiles, file => (
                <Row key={file.id}>
                  <Col size={10}>
                    <pre
                      style={{
                        textDecoration: redundantFiles[file.path] && 'line-through',
                      }}
                    >
                      <Icon icon={file.isFile ? 'file' : 'folder'} /> {file.path}
                    </pre>
                  </Col>
                  <Col size={2} className='text-xs-right'>
                    <ActionButton handler={this._unselectFile} handlerParam={file} icon='remove' size='small' />
                  </Col>
                </Row>
              ))}
            </Container>
          ) : (
            <em>{_('restoreFilesNoFilesSelected')}</em>
          ),
        ]}
      </div>
    )
  }
}
