declare module 'value-matcher' {
  function createPredicate(pattern: any): (value: any) => boolean
}
