import _ from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import endsWith from 'lodash/endsWith'
import Icon from 'icon'
import React from 'react'
import replace from 'lodash/replace'
import Tooltip from 'tooltip'
import { Container, Col, Row } from 'grid'
import { formatSize } from 'utils'
import { FormattedDate } from 'react-intl'
import { SelectPlainObject } from 'form'
import {
  find,
  isEmpty,
  map,
  filter
} from 'lodash'
import {
  scanDisk,
  scanFiles
} from 'xo'

const backupOptionRenderer = backup => <span>
  {backup.tag} - {backup.remoteName}
  {' '}
  (<FormattedDate value={backup.datetime * 1e3} month='long' day='numeric' year='numeric' hour='2-digit' minute='2-digit' second='2-digit' />)
</span>

const partitionOptionRenderer = partition => <span>
  {partition.name} {partition.type} {partition.size && `(${formatSize(+partition.size)})`}
</span>

const diskOptionRenderer = disk => <span>
  {disk.name}
</span>

const fileOptionRenderer = file => <span>
  {file.name}
</span>

const formatFilesOptions = (rawFiles, path) => {
  const files = path !== '/'
    ? [{
      name: '..',
      id: '..',
      path: getParentPath(path),
      content: {}
    }]
    : []

  return files.concat(map(rawFiles, (file, name) => ({
    name,
    id: `${path}${name}`,
    path: `${path}${name}`,
    content: file
  })))
}

const getParentPath = path => replace(path, /^(\/+.+)*(\/+.+)/, '$1/')

// -----------------------------------------------------------------------------

export default class RestoreFileModalBody extends Component {
  state = {
    format: 'zip'
  }

  get value () {
    const { state } = this

    return {
      disk: state.disk,
      format: state.format,
      partition: state.partition,
      paths: state.selectedFiles && map(state.selectedFiles, 'path'),
      remote: state.backup.remoteId
    }
  }

  _scanFiles = () => {
    const { backup, disk, partition, path } = this.state
    this.setState({ scanningFiles: true })

    return scanFiles(backup.remoteId, disk, path, partition).then(
      rawFiles => this.setState({
        files: formatFilesOptions(rawFiles, path),
        scanningFiles: false
      }),
      error => {
        this.setState({
          scanningFiles: false,
          scanFilesError: true
        })
        throw error
      }
    )
  }

  _onBackupChange = backup => {
    this.setState({
      backup,
      disk: undefined,
      partition: undefined,
      file: undefined,
      selectedFiles: undefined,
      scanDiskError: false
    })
  }

  _onDiskChange = disk => {
    this.setState({
      partition: undefined,
      file: undefined,
      selectedFiles: undefined,
      scanDiskError: false
    })

    if (!disk) {
      return
    }

    scanDisk(this.state.backup.remoteId, disk).then(
      ({ partitions }) => {
        if (isEmpty(partitions)) {
          this.setState({
            disk,
            path: '/'
          }, this._scanFiles)

          return
        }

        this.setState({
          disk,
          partitions
        })
      },
      error => {
        this.setState({
          disk,
          scanDiskError: true
        })
        throw error
      }
    )
  }

  _onPartitionChange = partition => {
    this.setState({
      partition,
      path: '/',
      file: undefined,
      selectedFiles: undefined
    }, partition && this._scanFiles)
  }

  _onFileChange = file => {
    const { path, selectedFiles } = this.state
    const isFile = file && file.id !== '..' && !endsWith(file.path, '/')

    if (isFile) {
      this.setState({
        file,
        selectedFiles: find(selectedFiles, { id: file.id })
          ? selectedFiles
          : (selectedFiles || []).concat(file)
      })
      return
    }

    this.setState({
      file: undefined
    })

    // Ugly workaround to keep the ReactSelect open after selecting a folder
    // FIXME: Remove and use isOpen/alwaysOpen prop once one of these issues is fixed:
    // https://github.com/JedWatson/react-select/issues/662 -> /pull/817
    // https://github.com/JedWatson/react-select/issues/962 -> /pull/1015
    const select = document.activeElement
    select.blur()
    select.focus()

    if (file) {
      this.setState({
        path: file.id === '..' ? getParentPath(path) : file.path
      }, this._scanFiles)
    }
  }

  _unselectFile = file => {
    this.setState({
      selectedFiles: filter(this.state.selectedFiles, ({ id }) => id !== file.id)
    })
  }

  _unselectAllFiles = () => {
    this.setState({
      selectedFiles: undefined
    })
  }

  _selectAllFolderFiles = () => {
    const { files, selectedFiles } = this.state

    this.setState({
      selectedFiles: (selectedFiles || []).concat(
        filter(files, ({ path }) =>
          !endsWith(path, '/') && !find(selectedFiles, file => file.path === path)
        )
      )
    })
  }

  // ---------------------------------------------------------------------------

  render () {
    const { backups } = this.props
    const {
      backup,
      disk,
      file,
      files,
      format,
      partition,
      partitions,
      path,
      scanDiskError,
      scanFilesError,
      scanningFiles,
      selectedFiles
    } = this.state
    const noPartitions = isEmpty(partitions)

    return <div>
      <SelectPlainObject
        onChange={this._onBackupChange}
        optionKey='id'
        optionRenderer={backupOptionRenderer}
        options={backups}
        placeholder={_('restoreFilesSelectBackup')}
        value={backup}
      />
      {backup && [
        <br />,
        <SelectPlainObject
          onChange={this._onDiskChange}
          optionKey='id'
          optionRenderer={diskOptionRenderer}
          options={backup.disks}
          placeholder={_('restoreFilesSelectDisk')}
          value={disk}
        />
      ]}
      {scanDiskError &&
        <span>
          <Icon icon='error' /> {_('restoreFilesDiskError')}
        </span>
      }
      {disk && !scanDiskError && !noPartitions && [
        <br />,
        <SelectPlainObject
          onChange={this._onPartitionChange}
          optionKey='id'
          optionRenderer={partitionOptionRenderer}
          options={partitions}
          placeholder={_('restoreFilesSelectPartition')}
          value={partition}
        />
      ]}
      {(partition || disk && !scanDiskError && noPartitions) && [
        <br />,
        <Container>
          <Row>
            <Col size={10}>
              <pre>
                {path} {scanningFiles && <Icon icon='loading' />}{scanFilesError && <Icon icon='error' />}
              </pre>
            </Col>
            <Col size={2}>
              <span className='pull-right'>
                <Tooltip content={_('restoreFilesSelectAllFiles')}>
                  <ActionButton btnStyle='secondary' handler={this._selectAllFolderFiles} icon='add' size='small' />
                </Tooltip>
              </span>
            </Col>
          </Row>
        </Container>,
        <SelectPlainObject
          onChange={this._onFileChange}
          optionKey='id'
          optionRenderer={fileOptionRenderer}
          options={files}
          placeholder={_('restoreFilesSelectFiles')}
          value={file}
        />,
        <br />,
        <div>
          <span className='mr-1'>
            <input
              checked={format === 'zip'}
              name='format'
              onChange={this.linkState('format')}
              type='radio'
              value='zip'
            /> ZIP
          </span>
          <span>
            <input
              checked={format === 'tar'}
              name='format'
              onChange={this.linkState('format')}
              type='radio'
              value='tar'
            /> TAR
          </span>
        </div>,
        <br />,
        selectedFiles && selectedFiles.length
          ? <Container>
            <Row>
              <Col className='pl-0 pb-1' size={10}>
                <em>{_('restoreFilesSelectedFiles', { files: selectedFiles.length })}</em>
              </Col>
              <Col size={2}>
                <span className='pull-right'>
                  <Tooltip content={_('restoreFilesUnselectAll')}>
                    <ActionButton btnStyle='secondary' handler={this._unselectAllFiles} icon='remove' size='small' />
                  </Tooltip>
                </span>
              </Col>
            </Row>
            {map(selectedFiles, file =>
              <Row key={file.id}>
                <Col size={10}>
                  <pre>{file.path}</pre>
                </Col>
                <Col size={2}>
                  <span className='pull-right'>
                    <ActionButton btnStyle='secondary' handler={this._unselectFile} handlerParam={file} icon='remove' size='small' />
                  </span>
                </Col>
              </Row>
            )}
          </Container>
          : <em>{_('restoreFilesNoFilesSelected')}</em>
      ]}
    </div>
  }
}
