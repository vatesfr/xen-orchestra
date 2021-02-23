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
