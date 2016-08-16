import React, { Component } from 'react'
import ReactSelect from 'react-select'
import {
  AutoSizer,
  VirtualScroll
} from 'react-virtualized'

import propTypes from '../prop-types'

const SELECT_MENU_STYLE = {
  overflow: 'hidden'
}

const SELECT_STYLE = {
  minWidth: '10em'
}

// See: https://github.com/bvaughn/react-virtualized-select/blob/master/source/VirtualizedSelect/VirtualizedSelect.js
@propTypes({
  maxHeight: propTypes.number,
  optionHeight: propTypes.number
})
export default class Select extends Component {
  static defaultProps = {
    maxHeight: 200,
    optionHeight: 40,
    optionRenderer: (option, labelKey) => option[labelKey]
  }

  _renderMenu = ({
    focusedOption,
    options,
    ...otherOptions
  }) => {
    const {
      maxHeight,
      optionHeight
    } = this.props

    const focusedOptionIndex = options.indexOf(focusedOption)
    const height = Math.min(maxHeight, options.length * optionHeight)

    const wrappedRowRenderer = ({ index }) =>
      this._optionRenderer({
        ...otherOptions,
        focusedOption,
        focusedOptionIndex,
        option: options[index],
        options
      })

    return (
      <AutoSizer disableHeight>
        {({ width }) => (
          <VirtualScroll
            height={height}
            rowCount={options.length}
            rowHeight={optionHeight}
            rowRenderer={wrappedRowRenderer}
            scrollToIndex={focusedOptionIndex}
            width={width}
          />
        )}
      </AutoSizer>
    )
  }

  _optionRenderer = ({
    focusedOption,
    focusOption,
    labelKey,
    option,
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
        style={{ height: props.optionHeight }}
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
