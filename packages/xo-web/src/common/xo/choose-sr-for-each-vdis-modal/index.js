import Collapse from 'collapse'
import Component from 'base-component'
import PropTypes from 'prop-types'
import React from 'react'
import { Container, Col } from 'grid'
import { isEmpty, map } from 'lodash'
import { isSrWritable } from 'xo'
import { Vdi } from 'render-xo-item'

import _ from '../../intl'
import SingleLineRow from '../../single-line-row'
import { Select } from '../../form'
import { SelectHost, SelectSr } from '../../select-objects'

// what to do with one disk, mirroring the targets the backend accepts in `mapVdisSrs`
const RESTORE = 'restore'
const LIVE_MOUNT = 'live-mount'
const IGNORE = 'ignore'

const VDI_TARGET_OPTIONS = [
  { label: _('vdiTargetRestore'), value: RESTORE },
  { label: _('vdiTargetLiveMount'), value: LIVE_MOUNT },
  { label: _('vdiTargetIgnore'), value: IGNORE },
]

const Collapsible = ({ collapsible, children, ...props }) =>
  collapsible ? (
    <Collapse {...props}>{children}</Collapse>
  ) : (
    <div>
      <span>{props.buttonText}</span>
      <br />
      {children}
    </div>
  )

Collapsible.propTypes = {
  collapsible: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired,
}

export default class ChooseSrForEachVdisModal extends Component {
  static propTypes = {
    mainSrPredicate: PropTypes.func,
    onChange: PropTypes.func.isRequired,
    srPredicate: PropTypes.func,
    value: PropTypes.objectOf(
      PropTypes.shape({
        mainSr: PropTypes.object,
        mapVdisSrs: PropTypes.object,
      })
    ).isRequired,
    vdis: PropTypes.object.isRequired,

    // offer a target per disk (restore to an SR, live mount on a host, or do not restore) instead
    // of a single SR selector. `mapVdisSrs` then holds a target object per disk.
    withVdiTargets: PropTypes.bool,
  }

  _onChange = newValues => {
    this.props.onChange({
      ...this.props.value,
      ...newValues,
    })
  }

  _onChangeMainSr = mainSr => this._onChange({ mainSr })

  _onChangeVdiSr = (vdi, sr) =>
    this._onChange({
      mapVdisSrs: { ...this.props.value.mapVdisSrs, [vdi.uuid]: sr },
    })

  // the target replaces the previous one instead of being merged into it, so no SR or host chosen
  // for another action is carried over
  _onChangeVdiTarget = (vdi, target) =>
    this._onChange({
      mapVdisSrs: { ...this.props.value.mapVdisSrs, [vdi.uuid]: target },
    })

  _renderVdiTarget(vdi, srPredicate) {
    // only targets written here are expected: a bare SR, as the legacy shape stores, would read as
    // a restore with no SR chosen
    const target = this.props.value.mapVdisSrs?.[vdi.uuid]
    const type = target?.type ?? RESTORE

    return (
      <SingleLineRow key={vdi.uuid}>
        <Col size={4}>{vdi.name !== undefined ? vdi.name : <Vdi id={vdi.id} showSize />}</Col>
        <Col size={4}>
          <Select
            labelKey='label'
            onChange={newType => this._onChangeVdiTarget(vdi, { type: newType })}
            options={VDI_TARGET_OPTIONS}
            required
            simpleValue
            value={type}
            valueKey='value'
          />
        </Col>
        <Col size={4}>
          {type === RESTORE && (
            <SelectSr
              onChange={sr => this._onChangeVdiTarget(vdi, { type: RESTORE, sr: sr ?? undefined })}
              predicate={srPredicate}
              value={target?.sr}
            />
          )}
          {type === LIVE_MOUNT && (
            <SelectHost
              onChange={host => this._onChangeVdiTarget(vdi, { type: LIVE_MOUNT, host: host ?? undefined })}
              required
              value={target?.host}
            />
          )}
        </Col>
      </SingleLineRow>
    )
  }

  render() {
    const { props } = this
    const {
      mainSrPredicate = isSrWritable,
      placeholder,
      required,
      srPredicate = mainSrPredicate,
      value: { mainSr, mapVdisSrs },
      vdis,
      withVdiTargets = false,
    } = props

    return (
      <div>
        <SingleLineRow>
          <Col size={6}>{_('selectDestinationSr')}</Col>
          <Col size={6}>
            <SelectSr
              onChange={this._onChangeMainSr}
              placeholder={placeholder !== undefined ? placeholder : _('chooseSrForEachVdisModalMainSr')}
              predicate={mainSrPredicate}
              required={required}
              value={mainSr}
            />
          </Col>
        </SingleLineRow>
        {!required && <i>{_('optionalEntry')}</i>}
        <br />
        {!isEmpty(vdis) && (
          <Collapsible
            buttonText={withVdiTargets ? _('vdiTargetSelectAction') : _('chooseSrForEachVdisModalSelectSr')}
            collapsible
            size='small'
          >
            <br />
            <Container>
              <SingleLineRow>
                <Col size={withVdiTargets ? 4 : 6}>
                  <strong>{_('chooseSrForEachVdisModalVdiLabel')}</strong>
                </Col>
                {withVdiTargets && (
                  <Col size={4}>
                    <strong>{_('vdiTargetActionLabel')}</strong>
                  </Col>
                )}
                <Col size={withVdiTargets ? 4 : 6}>
                  <strong>
                    {withVdiTargets ? _('vdiTargetDestinationLabel') : _('chooseSrForEachVdisModalSrLabel')}
                  </strong>
                </Col>
              </SingleLineRow>
              {withVdiTargets
                ? map(vdis, vdi => this._renderVdiTarget(vdi, srPredicate))
                : map(vdis, vdi => (
                    <SingleLineRow key={vdi.uuid}>
                      <Col size={6}>{vdi.name !== undefined ? vdi.name : <Vdi id={vdi.id} showSize />}</Col>
                      <Col size={6}>
                        <SelectSr
                          onChange={sr => this._onChangeVdiSr(vdi, sr)}
                          predicate={srPredicate}
                          value={mapVdisSrs !== undefined && mapVdisSrs[vdi.uuid]}
                        />
                      </Col>
                    </SingleLineRow>
                  ))}
              {!withVdiTargets && <i>{_('optionalEntry')}</i>}
            </Container>
          </Collapsible>
        )}
      </div>
    )
  }
}
