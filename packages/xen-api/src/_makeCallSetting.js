export default (setting, defaultValue) =>
  setting === undefined
    ? () => defaultValue
    : typeof setting === 'function'
    ? setting
    : typeof setting === 'object'
    ? method => setting[method] ?? setting['*'] ?? defaultValue
    : () => setting
