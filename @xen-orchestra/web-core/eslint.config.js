import antfu from '@antfu/eslint-config'

export default antfu({
  rules: {
    'import/order': ['error', { alphabetize: { order: 'asc', orderImportKind: 'asc' } }],
  },
  overrides: {
    vue: {
      'vue/component-api-style': 'error',
      'vue/no-empty-component-block': 'error',
      'vue/block-order': ['error', { order: ['template', 'script', 'style'] }],
    },
  },
})
