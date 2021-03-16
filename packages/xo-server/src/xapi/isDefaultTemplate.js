export default ({ is_default_template, other_config }) =>
  is_default_template || other_config.default_template === 'true'
