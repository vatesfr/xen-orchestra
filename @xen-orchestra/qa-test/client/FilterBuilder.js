/**
 * Builder class for constructing XenOrchestra REST API filters.
 *
 * Handles the complex syntax and encoding requirements for XenOrchestra's
 * REST API filtering system, providing a clean interface for different
 * filter types and operators.
 *
 * @class FilterBuilder
 */
export class FilterBuilder {
  /**
   * Filter criteria storage
   * @type {Array<string>}
   * @private
   */
  #filters = []

  /**
   * Field selection storage
   * @type {Array<string>}
   * @private
   */
  #fields = []

  /**
   * Additional parameters storage
   * @type {Object}
   * @private
   */
  #additionalParams = {}

  /**
   * Creates a new FilterBuilder instance.
   */
  constructor() {
    this.#filters = []
    this.#fields = []
    this.#additionalParams = {}
  }

  /**
   * Add a generic property filter with value.
   * Supports arrays for creating multiple filters (AND logic with space-separation).
   *
   * @param {string} property - Property name
   * @param {string|number|string[]|number[]} value - Property value or array of values
   * @param {string} [operator="="] - Comparison operator (=, <, >, <=, >=, !=)
   * @returns {FilterBuilder} This instance for chaining
   */
  withProperty(property, value, operator = '=') {
    if (!property || value === undefined || value === null) return this

    // Handle array values by creating multiple filters
    if (Array.isArray(value)) {
      value.forEach(v => {
        if (operator === '=') {
          this.#filters.push(`${property}:"${v}"`)
        } else {
          this.#filters.push(`${property}:${operator}${v}`)
        }
      })
      return this
    }

    // For exact match, use quoted syntax
    if (operator === '=') {
      this.#filters.push(`${property}:"${value}"`)
    } else {
      // For other operators, use colon syntax: property:operator value
      this.#filters.push(`${property}:${operator}${value}`)
    }
    return this
  }

  /**
   * Add a regex pattern filter.
   * Converts JavaScript regex to complex-matcher format.
   *
   * @param {string} property - Property name to match against
   * @param {string|RegExp} pattern - Regex pattern
   * @returns {FilterBuilder} This instance for chaining
   */
  withRegex(property, pattern) {
    if (!property || !pattern) return this

    let regexString
    if (pattern instanceof RegExp) {
      // Extract the source from RegExp object
      regexString = pattern.source
    } else if (typeof pattern === 'string') {
      regexString = pattern
    } else {
      return this
    }

    // Format for complex-matcher: property:/regex/
    this.#filters.push(`${property}:/${regexString}/`)
    return this
  }

  /**
   * Add a glob pattern filter.
   * Supports wildcards like * and ? for pattern matching.
   *
   * @param {string} property - Property name
   * @param {string} pattern - Glob pattern (e.g., "test*", "*vm*")
   * @returns {FilterBuilder} This instance for chaining
   */
  withGlob(property, pattern) {
    if (!property || !pattern) return this

    // For glob patterns, use the pattern directly with property
    this.#filters.push(`${property}:${pattern}`)
    return this
  }

  /**
   * Add a custom filter string directly.
   * Use this for complex filters not covered by other methods.
   *
   * @param {string} filterString - Raw filter string
   * @returns {FilterBuilder} This instance for chaining
   */
  withCustomFilter(filterString) {
    if (!filterString) return this
    this.#filters.push(filterString)
    return this
  }

  /**
   * Specify which fields to return in the response.
   *
   * @param {string|string[]} fields - Field name or array of field names
   * @returns {FilterBuilder} This instance for chaining
   */
  selectFields(fields) {
    if (!fields) return this

    if (Array.isArray(fields)) {
      this.#fields.push(...fields)
    } else {
      this.#fields.push(fields)
    }
    return this
  }

  /**
   * Add additional query parameters.
   *
   * @param {string} key - Parameter key
   * @param {string|number} value - Parameter value
   * @returns {FilterBuilder} This instance for chaining
   */
  withParam(key, value) {
    if (!key || value === undefined || value === null) return this
    this.#additionalParams[key] = value
    return this
  }

  /**
   * Build a filter from a simple object.
   *
   * @param {Object} filter - Filter object with properties
   * @returns {FilterBuilder} This instance for chaining
   */
  fromObject(filter) {
    if (!filter || typeof filter !== 'object') return this

    // Handle all properties generically
    Object.entries(filter).forEach(([key, value]) => {
      // Check if value contains an operator
      if (typeof value === 'string' && value.length > 0) {
        const operatorMatch = value.match(/^([><]=?|[!=]=?)(.*)/)
        if (operatorMatch) {
          const [, operator, actualValue] = operatorMatch
          // Use complex-matcher format: property:operator:value (NOT property:"operator:value")
          this.withCustomFilter(`${key}:${operator}${actualValue}`)
        } else {
          this.withProperty(key, value)
        }
      } else {
        this.withProperty(key, value)
      }
    })

    return this
  }

  /**
   * Build the complete query string for the REST API.
   *
   * @returns {string} Complete query string ready for URL
   */
  build() {
    const params = new URLSearchParams()

    // Add filters (space-separated for intersection)
    if (this.#filters.length > 0) {
      params.append('filter', this.#filters.join(' '))
    }

    // Add fields (comma-separated or * for all)
    if (this.#fields.length > 0) {
      params.append('fields', this.#fields.join(','))
    } else {
      params.append('fields', '*')
    }

    // Add additional parameters
    Object.entries(this.#additionalParams).forEach(([key, value]) => {
      params.append(key, value)
    })

    return params.toString()
  }

  /**
   * Build just the filter part for URLs that expect only the filter parameter.
   *
   * @returns {string} Filter string ready for URL encoding
   */
  buildFilter() {
    return this.#filters.join(' ')
  }

  /**
   * Check if any filters have been added.
   *
   * @returns {boolean} True if filters exist
   */
  hasFilters() {
    return this.#filters.length > 0
  }

  /**
   * Check if any fields have been selected.
   *
   * @returns {boolean} True if fields are selected
   */
  hasFields() {
    return this.#fields.length > 0
  }

  /**
   * Check if any additional parameters have been added.
   *
   * @returns {boolean} True if additional parameters exist
   */
  hasAdditionalParams() {
    return Object.keys(this.#additionalParams).length > 0
  }

  /**
   * Check if this FilterBuilder has any meaningful content.
   *
   * @returns {boolean} True if there are filters, fields, or parameters
   */
  hasContent() {
    return this.hasFilters() || this.hasFields() || this.hasAdditionalParams()
  }

  /**
   * Clear all filters and start fresh.
   *
   * @returns {FilterBuilder} This instance for chaining
   */
  clear() {
    this.#filters = []
    this.#fields = []
    this.#additionalParams = {}
    return this
  }

  /**
   * Create a new FilterBuilder instance (static factory method).
   *
   * @returns {FilterBuilder} New FilterBuilder instance
   */
  static create() {
    return new FilterBuilder()
  }

  /**
   * Create a FilterBuilder from a simple object (static factory method).
   *
   * @param {Object} filter - Filter object
   * @returns {FilterBuilder} New FilterBuilder instance with filters applied
   */
  static fromObject(filter) {
    return new FilterBuilder().fromObject(filter)
  }
}
