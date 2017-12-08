# ${pkg.name} [![Build Status](https://travis-ci.org/${pkg.shortGitHubPath}.png?branch=master)](https://travis-ci.org/${pkg.shortGitHubPath})

> ${pkg.description}

Differences with [reselect](https://github.com/reactjs/reselect):

- simpler: no custom memoization
- inputs (and their selectors): are stored in objects, not arrays
- lazy:
   - inputs are not computed before accessed
   - unused inputs do not trigger a call to the transform function

## Install

Installation of the [npm package](https://npmjs.org/package/${pkg.name}):

```
> npm install --save ${pkg.name}
```

## Usage

```js
import createSelector from 'smart-selector'

const getVisibleTodos = createSelector(
  {
    filter: state => state.filter,
    todos: state => state.todos,
  },
  inputs => {
    switch (inputs.filter) {
      case 'ALL':
        return inputs.todos
      case 'COMPLETED':
        return inputs.todos.filter(todo => todo.completed)
      case 'ACTIVE':
        return inputs.todos.filter(todo => !todo.completed)
    }
  }
)
```

## Development

```
# Install dependencies
> yarn

# Run the tests
> yarn test

# Continuously compile
> yarn dev

# Continuously run the tests
> yarn dev-test

# Build for production (automatically called by npm install)
> yarn build
```

## Contributions

Contributions are *very* welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xo-web/issues)
  you've encountered;
- fork and create a pull request.

## License

ISC © [Vates SAS](https://vates.fr)
