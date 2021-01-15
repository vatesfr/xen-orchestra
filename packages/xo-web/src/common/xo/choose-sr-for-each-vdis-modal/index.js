import Collapse from 'collapse'
import Component from 'base-component'
import PropTypes from 'prop-types'
import React from 'react'
import { map } from 'lodash'
import { Vdi } from 'render-xo-item'

import _ from '../../intl'
import SingleLineRow from '../../single-line-row'
import { Container, Col } from 'grid'
import { isSrWritable } from 'xo'
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
      mainSrPredicate = isSrWritable,
      srPredicate = mainSrPredicate,
      value: { mainSr, mapVdisSrs },
    } = props

    return (
      <div>
        <SelectSr
          onChange={this._onChangeMainSr}
          placeholder={_('chooseSrForEachVdisModalMainSr')}
          predicate={mainSrPredicate}
          required
          value={mainSr}
        />
        <br />
        {props.vdis != null && mainSr != null && (
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
              {map(props.vdis, vdi => (
                <SingleLineRow key={vdi.uuid}>
                  <Col size={6}>
                    <Vdi id={vdi.id} showSize />
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
