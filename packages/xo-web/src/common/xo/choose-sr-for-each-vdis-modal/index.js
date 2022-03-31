import Collapse from 'collapse'
import Component from 'base-component'
import Icon from 'icon'
import PropTypes from 'prop-types'
import React from 'react'
import Tooltip from 'tooltip'
import { Container, Col } from 'grid'
import { isEmpty, map } from 'lodash'
import { isSrWritable } from 'xo'
import { Vdi } from 'render-xo-item'

import _ from '../../intl'
import SingleLineRow from '../../single-line-row'
import { SelectSr } from '../../select-objects'

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
    ignorableVdis: PropTypes.bool,
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
  }

  _onChange = newValues => {
    this.props.onChange({
      ...this.props.value,
      ...newValues,
    })
  }

  _onChangeMainSr = mainSr => this._onChange({ mainSr })

  render() {
    const { props } = this
    const {
      ignorableVdis = false,
      mainSrPredicate = isSrWritable,
      placeholder,
      srPredicate = mainSrPredicate,
      value: { mainSr, mapVdisSrs },
      vdis,
    } = props

    return (
      <div>
        <SelectSr
          onChange={this._onChangeMainSr}
          placeholder={placeholder !== undefined ? placeholder : _('chooseSrForEachVdisModalMainSr')}
          predicate={mainSrPredicate}
          required
          value={mainSr}
        />
        <br />
        {!isEmpty(vdis) && mainSr != null && (
          <Collapsible buttonText={_('chooseSrForEachVdisModalSelectSr')} collapsible size='small'>
            <br />
            <Container>
              <SingleLineRow>
                <Col size={6}>
                  <strong>{_('chooseSrForEachVdisModalVdiLabel')}</strong>
                </Col>
                <Col size={6}>
                  <strong>{_('chooseSrForEachVdisModalSrLabel')}</strong>
                </Col>
              </SingleLineRow>
              {map(vdis, vdi => (
                <SingleLineRow key={vdi.uuid}>
                  <Col size={ignorableVdis ? 5 : 6}>
                    {vdi.name !== undefined ? vdi.name : <Vdi id={vdi.id} showSize />}
                  </Col>
                  <Col size={6}>
                    <SelectSr
                      onChange={sr =>
                        this._onChange({
                          mapVdisSrs: { ...mapVdisSrs, [vdi.uuid]: sr },
                        })
                      }
                      predicate={srPredicate}
                      value={mapVdisSrs !== undefined && mapVdisSrs[vdi.uuid]}
                    />
                  </Col>
                  {ignorableVdis && (
                    <Col size={1}>
                      <Tooltip content={_('ignoreVdi')}>
                        <a
                          role='button'
                          onClick={() =>
                            this._onChange({
                              mapVdisSrs: { ...mapVdisSrs, [vdi.uuid]: null },
                            })
                          }
                        >
                          <Icon icon='remove' />
                        </a>
                      </Tooltip>
                    </Col>
                  )}
                </SingleLineRow>
              ))}
              <i>{_('optionalEntry')}</i>
            </Container>
          </Collapsible>
        )}
      </div>
    )
  }
}
