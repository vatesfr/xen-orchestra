import map from 'lodash/map'
import React, { Component } from 'react'
import ReactSelect from 'react-select'
import sum from 'lodash/sum'
import {
  AutoSizer,
  CellMeasurer,
  List
} from 'react-virtualized'

import propTypes from '../prop-types'

const SELECT_MENU_STYLE = {
  overflow: 'hidden'
}

const SELECT_STYLE = {
  minWidth: '10em'
}

const LIST_STYLE = {
  whiteSpace: 'normal'
}

const MAX_OPTIONS = 5

// See: https://github.com/bvaughn/react-virtualized-select/blob/master/source/VirtualizedSelect/VirtualizedSelect.js
@propTypes({
  maxHeight: propTypes.number
})
export default class Select extends Component {
  static defaultProps = {
    maxHeight: 200,
    optionRenderer: (option, labelKey) => option[labelKey]
  }

  _renderMenu = ({
    focusedOption,
    options,
    ...otherOptions
  }) => {
    const { maxHeight } = this.props

    const focusedOptionIndex = options.indexOf(focusedOption)
    let height = options.length > MAX_OPTIONS && maxHeight

    const wrappedRowRenderer = ({ index, key, style }) =>
      this._optionRenderer({
        ...otherOptions,
        focusedOption,
        focusedOptionIndex,
        key,
        option: options[index],
        options,
        style
      })

    return (
      <AutoSizer disableHeight>
        {({ width }) => (
          width ? (
            <CellMeasurer
              cellRenderer={({ rowIndex }) => wrappedRowRenderer({ index: rowIndex })}
              columnCount={1}
              rowCount={options.length}
              // FIXME: 16 px: ugly workaround to take into account the scrollbar
              // during the offscreen render to measure the row height
              // See https://github.com/bvaughn/react-virtualized/issues/401
              width={width - 16}
            >
              {({ getRowHeight }) => {
                if (options.length <= MAX_OPTIONS) {
                  height = sum(map(options, (_, index) => getRowHeight({ index })))
                }

                return <List
                  height={height}
                  rowCount={options.length}
                  rowHeight={getRowHeight}
                  rowRenderer={wrappedRowRenderer}
                  scrollToIndex={focusedOptionIndex}
                  style={LIST_STYLE}
                  width={width}
                />
              }}
            </CellMeasurer>
          ) : null
        )}
      </AutoSizer>
    )
  }

  _optionRenderer = ({
    focusedOption,
    focusOption,
    key,
    labelKey,
    option,
    style,
    selectValue
  }) => {
    let className = 'Select-option'

    if (option === focusedOption) {
      className += ' is-focused'
    }

    const { disabled } = option

    if (disabled) {
      className += ' is-disabled'
    }

    const { props } = this

    return (
      <div
        className={className}
        onClick={!disabled && (() => selectValue(option))}
        onMouseOver={!disabled && (() => focusOption(option))}
        style={style}
        key={key}
      >
        {props.optionRenderer(option, labelKey)}
      </div>
    )
  }

  render () {
    return (
      <ReactSelect
        {...this.props}
        backspaceToRemoveMessage=''
        menuRenderer={this._renderMenu}
        menuStyle={SELECT_MENU_STYLE}
        style={SELECT_STYLE}
      />
    )
  }
}
