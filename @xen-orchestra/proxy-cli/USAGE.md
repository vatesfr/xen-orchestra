```
$ xo-proxy-cli --help

Usage:

  xo-proxy-cli <method> [<param>=<value>]...
    Call a method of the API and display its result.

  xo-proxy-cli [--file | -f] <file>
    Read a CSON or JSON file containing an object with `method` and `params`
    properties and call the API method.

    The file can also contain an array containing multiple calls, which will be
    run in sequence.
```
