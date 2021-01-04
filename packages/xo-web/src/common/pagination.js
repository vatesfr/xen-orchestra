import React from 'react'
import PropTypes from 'prop-types'

const PageItem = ({ active, children, disabled, onClick, value }) =>
  active ? (
    <li className='active page-item'>
      <span className='page-link'>{children}</span>
    </li>
  ) : disabled ? (
    <li className='disabled page-item'>
      <span className='page-link'>{children}</span>
    </li>
  ) : (
    <li className='page-item'>
      <a className='page-link' href='#' onClick={onClick} data-value={value}>
        {children}
      </a>
    </li>
  )

export default class Pagination extends React.PureComponent {
  static defaultProps = {
    ellipsis: true,
    maxButtons: 7,
    next: true,
    prev: true,
  }

  static propTypes = {
    ariaLabel: PropTypes.string,
    ellipsis: PropTypes.bool,
    maxButtons: PropTypes.number,
    next: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
    pages: PropTypes.number.isRequired,
    prev: PropTypes.bool,
    value: PropTypes.number.isRequired,
  }

  _onClick(event) {
    event.preventDefault()
    this.props.onChange(+event.currentTarget.dataset.value)
  }
  _onClick = this._onClick.bind(this)

  render() {
    const { ariaLabel, ellipsis, maxButtons, next, pages, prev, value } = this.props
    const onClick = this._onClick

    let min, max
    if (pages <= maxButtons) {
      min = 1
      max = pages
    } else {
      min = Math.max(1, Math.min(value - Math.floor(maxButtons / 2), pages - maxButtons + 1))
      max = min + maxButtons - 1
    }

    const pageButtons = []
    if (ellipsis && min !== 1) {
      pageButtons.push(
        <PageItem disabled key='firstEllipsis'>
          …
        </PageItem>
      )
    }
    for (let page = min; page <= max; ++page) {
      pageButtons.push(
        <PageItem active={page === value} key={page} onClick={onClick} value={page}>
          {page}
        </PageItem>
      )
    }
    if (ellipsis && max !== pages) {
      pageButtons.push(
        <PageItem disabled key='lastEllipsis'>
          …
        </PageItem>
      )
    }
    return (
      <nav aria-label={ariaLabel}>
        <ul className='pagination'>
          {prev && (
            <PageItem aria-label='Previous' disabled={value === 1} onClick={onClick} value={value - 1}>
              ‹
            </PageItem>
          )}
          {pageButtons}
          {next && (
            <PageItem aria-label='Next' disabled={value === pages} onClick={onClick} value={value + 1}>
              ›
            </PageItem>
          )}
        </ul>
      </nav>
    )
  }
}
