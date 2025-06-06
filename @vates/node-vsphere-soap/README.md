forked from https://github.com/reedog117/node-vsphere-soap

# node-vsphere-soap

[![Join the chat at https://gitter.im/reedog117/node-vsphere-soap](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/reedog117/node-vsphere-soap?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

This is a Node.js module to connect to VMware vCenter servers and/or ESXi hosts and perform operations using the [vSphere Web Services API]. If you're feeling really adventurous, you can use this module to port vSphere operations from other languages (such as the Perl, Python, and Go libraries that exist) and have fully native Node.js code controlling your VMware virtual infrastructure!

This is very much in alpha.

## Authors

- Patrick C - [@reedog117]

## Version

0.0.2-5

## Installation

```sh
$ npm install node-vsphere-soap --save
```

## Sample Code

### To connect to a vCenter server

    var nvs = require('node-vsphere-soap');
    var vc = new nvs.Client(host, user, password, sslVerify);
    vc.once('ready', function() {
      // perform work here
    });
    vc.once('error', function(err) {
      // handle error here
    });

#### Arguments

- host = hostname or IP of vCenter/ESX/ESXi server
- user = username
- password = password
- sslVerify = true|false - set to false if you have self-signed/unverified certificates

#### Events

- ready = emits when session authenticated with server
- error = emits when there's an error
  - _err_ contains the error

#### Client instance variables

- serviceContent - ServiceContent object retrieved by RetrieveServiceContent API call
- userName - username of authenticated user
- fullName - full name of authenticated user

### To run a command

    var vcCmd = vc.runCommand( commandToRun, arguments );
    vcCmd.once('result', function( result, raw, soapHeader) {
      // handle results
    });
    vcCmd.once('error', function( err) {
      // handle errors
    });

#### Arguments

- commandToRun = Method from the vSphere API
- arguments = JSON document containing arguments to send

#### Events

- result = emits when session authenticated with server
  - _result_ contains the JSON-formatted result from the server
  - _raw_ contains the raw SOAP XML response from the server
  - _soapHeader_ contains any soapHeaders from the server
- error = emits when there's an error
  - _err_ contains the error

Make sure you check out tests/vsphere-soap.test.js for examples on how to create commands to run

## Development

node-vsphere-soap uses a number of open source projects to work properly:

- [node.js] - evented I/O for the backend
- [node-soap] - SOAP client for Node.js
- [soap-cookie] - cookie authentication for the node-soap module
- [lodash] - for quickly manipulating JSON
- [lab] - testing engine
- [code] - assertion engine used with lab

Want to contribute? Great!

### Todo's

- Write More Tests
- Create Travis CI test harness with a fake vCenter Instance
- Add Code Comments

### Testing

I have been testing on a Mac with node v0.10.36 and both ESXi and vCenter 5.5.

To edit tests, edit the file **test/vsphere-soap.test.js**

To point the module at your own vCenter/ESXi host, edit **config-test.stub.js** and save it as **config-test.js**

To run test scripts:

```sh
$ npm test
```

## License

MIT

[vSphere Web Services API]: http://pubs.vmware.com/vsphere-55/topic/com.vmware.wssdk.apiref.doc/right-pane.html
[node-soap]: https://github.com/vpulim/node-soap
[node.js]: http://nodejs.org/
[soap-cookie]: https://github.com/shanestillwell/soap-cookie
[code]: https://github.com/hapijs/code
[lab]: https://github.com/hapijs/lab
[lodash]: https://lodash.com/
[@reedog117]: http://www.twitter.com/reedog117
