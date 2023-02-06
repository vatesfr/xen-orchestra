<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# {{pkg.name}}

{{#unless pkg.private}}
[![Package Version](https://badgen.net/npm/v/{{pkg.name}})](https://npmjs.org/package/{{pkg.name}}) ![License](https://badgen.net/npm/license/{{pkg.name}}) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/{{pkg.name}})](https://bundlephobia.com/result?p={{pkg.name}}) [![Node compatibility](https://badgen.net/npm/node/{{pkg.name}})](https://npmjs.org/package/{{pkg.name}})

{{/unless}}
{{#if pkg.description}}
> {{pkg.description}}

{{/if}}
{{#unless pkg.private}}
## Install

Installation of the [npm package](https://npmjs.org/package/{{pkg.name}}):

```sh
npm install --{{#if pkg.preferGlobal}}global{{^}}save{{/if}} {{pkg.name}}
```

{{/unless}}
{{#if usage}}
## Usage

{{{usage}}}

{{/if}}
## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue]({{pkg.bugs}})
  you've encountered;
- fork and create a pull request.

## License

[{{pkg.license}}](https://spdx.org/licenses/{{pkg.license}}) © [{{pkg.author.name}}]({{pkg.author.url}})
