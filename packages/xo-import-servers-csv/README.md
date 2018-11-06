# xo-import-servers-csv [![Build Status](https://travis-ci.org/vatesfr/xen-orchestra.png?branch=master)](https://travis-ci.org/vatesfr/xen-orchestra)

> CLI to import servers in XO from a CSV file

## Install

Installation of the [npm package](https://npmjs.org/package/xo-import-servers-csv):

```
> npm install --global xo-import-servers-csv
```

## Usage

`servers.csv`:

```csv
host,username,password
xs1.company.net,user1,password1
xs2.company.net:8080,user2,password2
http://xs3.company.net,user3,password3
```

> The CSV file can also contains these optional fields: `label`, `autoConnect`, `allowUnauthorized`.

Shell command:

```
> xo-import-servers-csv 'https://xo.company.tld' admin@admin.net admin < servers.csv
```

## Development

```
# Install dependencies
> npm install

# Run the tests
> npm test

# Continuously compile
> npm run dev

# Continuously run the tests
> npm run dev-test

# Build for production (automatically called by npm install)
> npm run build
```

## Contributions

Contributions are *very* welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

ISC © [Vates SAS](http://vates.fr)
