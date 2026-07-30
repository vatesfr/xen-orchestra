export default {
  '*': 'prettier --ignore-unknown --write',
  '*.test.{js,ts}': () => 'npm test',
  '*.{{,c,m}j,t}s{,x}': "eslint --ignore-pattern '!*'",
}
