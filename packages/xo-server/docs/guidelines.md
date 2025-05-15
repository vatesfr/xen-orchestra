# Backend Project Guidelines

Theses guidelines are not absolute rules, but expect to have to explain to the reviewer if the PR does not explicit why the guideline is not used.

_Stability > Perfection | Clarity > Cleverness | Incremental Improvement > Rewrites_

## glossary

## Business Impact

1. **Handling**  
   Prevents midnight outages from uncaught crashes.

2. **Async + Timeouts**  
   Avoids hung processes that require manual restart.

3. **Dependency Control**  
   Reduces security vulnerabilities and upgrade headaches.

4. **Readability**  
   Cuts onboarding time for new engineers.

5. **Scalability**  
   Ensures the system works with 50K VMs as well as 50.

6. **Resource Management**  
   Prevents memory leaks and corrupted data from unclosed resources.

---

## Core Principles

1. Works First Priority

   - ✅ Passes basic smoke tests before optimization
   - ❌ Rewrote the entire module to shave 0.1ms off runtime
   - ⚠️ Works but skipped testing due to time constraints

2. No Trivial Changes

   - ✅ Fixed typo in log message + verified no side effects
   - ❌ Changed 'status' to 'state' globally without grep-checking
   - ⚠️ "Refactored" variable names but introduced a shadowed variable

3. Improve Continuously
   - ✅ Added type hints while fixing a bug
   - ❌ "This code is ugly but I won't touch it"
   - ⚠️ Refactored without tests "because it looked simple"

---

## Key Rules

### Asynchronous Code

- any asynchonous code must be awaited
- consider the use of a timeout handler

```ts
// ✅
await fs.promises.readFile()
await pTimeout(apiCall(), 10_000)

// ❌
fetch(url).then(logResult) // Unhandled promise

// ⚠️
Promise.all(requests) // No error handling or timeout
```

### Dependencies

Avoid new dependencies; prefer modern JS/TS.

```js
// ✅
const sum = (a, b) => a + b // Instead of lodash.add

// ❌
import leftPad from 'left-pad' // 4-line function

// ⚠️
import isNumber from 'validator' // Native check would work
```

### Error Handling

- error must be caught if they are recoverable
- don't silence error. Generally use a warn on unexpected error, an info on an expected error
- use error.cause or decorate original error with the relevant context.
- consider adding the current stacktrace to a new Error
- add an error code or a custom class extending error for custom errors

```ts
// ✅
try {
  db.insert();
} catch (error) {
  log.warn('DB full', { error });
  throw;
}
try{

}catch(err){
   const specificError= new Error('this is a specific error')
   specificError.cause = err
   specificError.code = 'ENOENT'
}


// ❌
JSON.parse(input); // No try/catch
try{
   asyncProcess() // no await => unbounded error
}catch(error){}
promise.catch(err=>throw err) // unbounded no stack trace

// ⚠️
try { parse(); } catch {} // Silenced error
try{

}catch(err){
   throw new Error('this is a specific error')// lost the original error
}
```

### Logging

Use structured logs with `@xen-orchestra/log` avoid flooding.

```ts
// ✅
log.info('VM started', { vmId, durationMs })

// ❌
console.log(`${vm} started at ${new Date()}`) // Unstructured

// ⚠️
log.error(err) // No context like VM ID
ayncPromise.catch(() => {}) // erro is forcibly silenced
```

### Readability

- name method and variable explicitly, especially on non typed code. For example, set/edit method should only be used on a typed object. Avoid generic code like for (const object of objects){}
- method parameter are readonly and explicit. They are typed.
- function name are readonly and explicit.
- limit number of parameters or use oject parameter

```ts
// ✅
for (const vm of runningVms) {
  await vm.stop()
}
function work(ref, { bootable, seekable, focusable = true, otherboolean = false } = {}) // work(1, {bootable: true , focusable:false})
// ❌
for (const x of y) {
  /* What's x? */
}

let set = (item, key, value) => (item[key] = value)
set = item => set(item, 'mykey', 4)

// ⚠️
items.forEach(item => process(item)) // 'item' too vague
function work(ref, bootable, seekable, focusable, otherboolean) //work(1, true, true, false,true) or work(1, true, false, false,true)
```

### Scalability

No unbounded memory/parallel ops.

```ts
// ✅
for await (const chunk of stream) {
  process(chunk)
}

// ❌
const allData = await fs.readFile('50TB.log')

// ⚠️
await Promise.all(users.map(fetchDetails)) // 50K parallel requests
```

### Testing

Use `node:assert`; test critical paths.

```js
// ✅
assert.strictEqual(result.status, 'running')

// ❌
if (result !== 'running') throw Error() // Ad-hoc

// ⚠️
assert(result) // No error message
```

### Typing

Zero `any`; JSDoc/TypeScript everywhere.

```ts
// ✅
/** @type {Array<{id: string}>} */
const vms = []

// ❌
const data = {} // Untyped

// ⚠️
function parse(input: any) {} // Leaky abstraction
```

Node 23 is around the corner and support a subset of typescript. It doesn't support enums, namespaces and parameters properties. Also is need to use the `type` keywork when importing type. If a module don't need this feature, it will be able to skip the compilation phase at build and keep te type checking in developpment mode

Any new module released after Node24 reach LTS should be configured to run natively and use tsconfig to check types during development.

### Resource Management

Always explicitly release resources using `Disposable`.

```ts
// ✅ Using Disposable helper
class DiskMount implements Disposable {
  async dispose() {
    await exec(`umount ${this.path}`)
  }
}

// ❌
const stream = fs.createReadStream('50TB.log')
// Never closed!

// ⚠️
try {
  stream = fs.createReadStream('50TB.log')
} finally {
  stream?.close() // Missing await if async
}
```

---

## Review Process

- Flexible but accountable:

  ```ts
  // ✅ PR Comment:
  'Used `any` here because legacy API response is unpredictable; added TODO for typing.'

  // ❌ PR Comment:
  'I know the guidelines say no `any` but it works.'
  ```

- Legacy code exceptions:
  ```ts
  // TODO: Refactor to use Disposable pattern
  ```

---

## Future Considerations

1. When Node.js AsyncDisposable reaches LTS:

   ```ts
   class FutureResource implements AsyncDisposable {
     async [Symbol.asyncDispose]() {
       await cleanup()
     }
   }
   ```

2. Gradual typing migration in javascript files:

   ```js
   // @ts-check
   /** @type {import('./types').VmConfig} */
   const config = loadConfig()
   ```
