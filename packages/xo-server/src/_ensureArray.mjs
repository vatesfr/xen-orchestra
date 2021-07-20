// Ensure the value is an array, wrap it if necessary.
export default value => (value === undefined ? [] : Array.isArray(value) ? value : [value])
