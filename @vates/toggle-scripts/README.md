<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @vates/toggle-scripts

[![Package Version](https://badgen.net/npm/v/@vates/toggle-scripts)](https://npmjs.org/package/@vates/toggle-scripts) ![License](https://badgen.net/npm/license/@vates/toggle-scripts) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@vates/toggle-scripts)](https://bundlephobia.com/result?p=@vates/toggle-scripts) [![Node compatibility](https://badgen.net/npm/node/@vates/toggle-scripts)](https://npmjs.org/package/@vates/toggle-scripts)

> Easily enable/disable scripts in package.json

## Install

Installation of the [npm package](https://npmjs.org/package/@vates/toggle-scripts):

```sh
npm install --save @vates/toggle-scripts
```

## Usage

```
Usage: toggle-scripts options...

  Easily enable/disable scripts in package.json

  Options
    +<script>    Enable the script <script>, ie remove the prefix `_`
    -<script>    Disable the script <script>, ie prefix it with `_`

  Examples
    toggle-scripts +postinstall +preuninstall
    toggle-scripts -postinstall -preuninstall
```

For example, if you want `postinstall` hook only in dev:

```json
// package.json
{
  "scripts": {
    "postinstall": "<some dev only command>",
    "prepublishOnly": "toggle-scripts -postinstall",
    "postpublish": "toggle-scripts +postinstall"
  }
}
```

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

[ISC](https://spdx.org/licenses/ISC) © [Vates SAS](https://vates.fr)
