<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# {{pkg.name}} [![Build Status](https://travis-ci.org/vatesfr/xen-orchestra.png?branch=master)](https://travis-ci.org/vatesfr/xen-orchestra)

{{#unless pkg.private}}
[![Package Version](https://badgen.net/npm/v/{{pkg.name}})](https://npmjs.org/package/{{pkg.name}}) ![License](https://badgen.net/npm/license/{{pkg.name}}) [![PackagePhobia](https://badgen.net/packagephobia/install/{{pkg.name}})](https://packagephobia.now.sh/result?p={{pkg.name}})

{{/unless}}
{{#if pkg.description}}
> {{pkg.description}}

{{/if}}
{{#unless pkg.private}}
## Install

Installation of the [npm package](https://npmjs.org/package/{{pkg.name}}):

```
> npm install --{{#if pkg.preferGlobal}}global{{^}}save{{/if}} {{pkg.name}}
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
