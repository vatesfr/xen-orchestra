import Collapse from 'collapse'
import Component from 'base-component'
import PropTypes from 'prop-types'
import React from 'react'
import store from 'store'
import { Container, Col } from 'grid'
import { every, isEmpty, map, mapValues } from 'lodash'
import { isSrWritable } from 'xo'
import { Vdi } from 'render-xo-item'

import _ from '../../intl'
import Icon from '../../icon'
import SingleLineRow from '../../single-line-row'
import { createSelector, getObject } from '../../selectors'
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

// the selectors hand back objects, but a default computed here is only known by its id
const resolveObject = objectOrId =>
  typeof objectOrId === 'string' ? getObject(store.getState(), objectOrId) : objectOrId

// a live mounted disk is exposed to a single host as an iSCSI SR, so it is only usable together
// with the disks being restored if that host can reach the SR they are restored to
const getLiveMountHostPredicate = sr =>
  sr == null ? undefined : sr.shared ? host => host.$pool === sr.$pool : host => host.id === sr.$container

// a local SR is only reachable from its own host, a shared one from every host of its pool, where
// the master is as good a default as any
const getDefaultLiveMountHost = sr =>
  sr == null ? undefined : sr.shared ? getObject(store.getState(), sr.$pool)?.master : sr.$container

const isLiveMountHostAllowed = (host, predicate) => {
  if (host == null) {
    return false
  }
  if (predicate === undefined) {
    return true
  }
  const object = resolveObject(host)
  return object !== undefined && predicate(object)
}

// a disk target is complete once the destination its action needs is known: a host to live mount
// on, or an SR to restore to, which is the main SR unless one is set for this disk
const isVdiTargetComplete = (target, mainSr) => {
  const type = target?.type ?? RESTORE
  if (type === RESTORE) {
    return (target?.sr ?? mainSr) != null
  }
  if (type === LIVE_MOUNT) {
    return target.host != null
  }
  return true
}

// meant for the modal bodies embedding this component with `withVdiTargets`, to refuse a
// confirmation which the server could not honor
export const areVdiTargetsComplete = ({ mainSr, mapVdisSrs } = {}, vdis) =>
  every(vdis, vdi => isVdiTargetComplete(mapVdisSrs?.[vdi.uuid], mainSr))

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

  _getMainSr = createSelector(() => this.props.value.mainSr, resolveObject)

  _getLiveMountHostPredicate = createSelector(this._getMainSr, getLiveMountHostPredicate)

  // the destination SR drives which hosts can live mount a disk: one which cannot reach the new SR
  // is not a valid destination any more and falls back to the default for that SR
  _onChangeMainSr = mainSr => {
    const { mapVdisSrs } = this.props.value
    if (!this.props.withVdiTargets || mapVdisSrs === undefined) {
      return this._onChange({ mainSr })
    }

    const sr = resolveObject(mainSr)
    const predicate = getLiveMountHostPredicate(sr)
    this._onChange({
      mainSr,
      mapVdisSrs: mapValues(mapVdisSrs, target =>
        target?.type === LIVE_MOUNT && !isLiveMountHostAllowed(target.host, predicate)
          ? { type: LIVE_MOUNT, host: getDefaultLiveMountHost(sr) }
          : target
      ),
    })
  }

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

  // a live mount needs a host, which is pre-selected so the common case does not have to be filled
  // in by hand
  _onChangeVdiAction = (vdi, type) =>
    this._onChangeVdiTarget(
      vdi,
      type === LIVE_MOUNT ? { type, host: getDefaultLiveMountHost(this._getMainSr()) } : { type }
    )

  _renderVdiTarget(vdi, srPredicate) {
    // only targets written here are expected: a bare SR, as the legacy shape stores, would read as
    // a restore with no SR chosen
    const target = this.props.value.mapVdisSrs?.[vdi.uuid]
    const type = target?.type ?? RESTORE
    const mainSr = this._getMainSr()

    return (
      <SingleLineRow key={vdi.uuid}>
        <Col size={4}>{vdi.name !== undefined ? vdi.name : <Vdi id={vdi.id} showSize />}</Col>
        <Col size={4}>
          <Select
            labelKey='label'
            onChange={newType => this._onChangeVdiAction(vdi, newType)}
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
              placeholder={mainSr != null ? _('vdiTargetUseMainSr') : _('selectDestinationSr')}
              predicate={srPredicate}
              value={target?.sr}
            />
          )}
          {type === LIVE_MOUNT && (
            <SelectHost
              onChange={host => this._onChangeVdiTarget(vdi, { type: LIVE_MOUNT, host: host ?? undefined })}
              predicate={this._getLiveMountHostPredicate()}
              required
              value={target?.host}
            />
          )}
          {!isVdiTargetComplete(target, mainSr) && (
            <span className='text-danger'>
              {type === LIVE_MOUNT ? _('vdiTargetHostRequired') : _('vdiTargetSrRequired')}
            </span>
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

    // the rows are collapsed by default, so what is missing in them has to be visible from outside
    const incompleteTargets = withVdiTargets && !areVdiTargetsComplete(props.value, vdis)

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
        {incompleteTargets && (
          <p className='text-danger'>
            <Icon icon='error' /> {_('vdiTargetIncompleteDestinations')}
          </p>
        )}
      </div>
    )
  }
}
