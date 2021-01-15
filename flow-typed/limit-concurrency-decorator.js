declare module 'limit-concurrency-decorator' {
  declare function limitConcurrencyDecorator(concurrency: number): <T: Function>(T) => T
  declare export default typeof limitConcurrencyDecorator
}
