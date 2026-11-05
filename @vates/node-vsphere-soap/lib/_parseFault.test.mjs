import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { parseFault } from './_parseFault.mjs'

// captured from an ESXi 8 host
const MANAGED_OBJECT_NOT_FOUND = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<soapenv:Body>
<soapenv:Fault><faultcode>ServerFaultCode</faultcode><faultstring>The object &apos;vim.VirtualMachine:vm-42&apos; has already been deleted or has not been completely created</faultstring><detail><ManagedObjectNotFoundFault xmlns="urn:vim25" xsi:type="ManagedObjectNotFound"><obj type="VirtualMachine">vm-42</obj></ManagedObjectNotFoundFault></detail></soapenv:Fault>
</soapenv:Body>
</soapenv:Envelope>`

// not what a vSphere host sends — SOAP 1.1 requires these children to be unqualified — but a body
// which node-soap failed to parse can come from anything sitting in front of vCenter
const NAMESPACE_PREFIXED = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:vim25="urn:vim25" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<soapenv:Body>
<soapenv:Fault><soapenv:faultcode>ServerFaultCode</soapenv:faultcode><soapenv:faultstring>Unable to access file since it is locked</soapenv:faultstring><soapenv:detail xmlns="urn:vim25"><vim25:FileLockedFault xsi:type="FileLocked"><vim25:localizedMessage>Unable to access file [ds1] vm/vm.vmdk since it is locked</vim25:localizedMessage></vim25:FileLockedFault></soapenv:detail></soapenv:Fault>
</soapenv:Body>
</soapenv:Envelope>`

describe('parseFault', function () {
  it('reads the fault from the envelope parsed by node-soap', function () {
    const { code, faultcode, faultstring, localizedMessage } = parseFault({
      root: {
        Envelope: {
          Body: {
            Fault: {
              faultcode: 'ServerFaultCode',
              faultstring: 'Unable to access file since it is locked',
              detail: {
                FileLockedFault: {
                  attributes: { 'xsi:type': 'FileLocked' },
                  localizedMessage: 'Unable to access file [ds1] vm/vm.vmdk since it is locked',
                },
              },
            },
          },
        },
      },
    })

    assert.equal(code, 'FileLocked')
    assert.equal(faultcode, 'ServerFaultCode')
    assert.equal(faultstring, 'Unable to access file since it is locked')
    assert.equal(localizedMessage, 'Unable to access file [ds1] vm/vm.vmdk since it is locked')
  })

  it('falls back to the element name when xsi:type is absent', function () {
    const { code } = parseFault({
      root: { Envelope: { Body: { Fault: { detail: { InvalidDeviceSpecFault: {} } } } } },
    })

    assert.equal(code, 'InvalidDeviceSpec')
  })

  it('falls back to the raw body when the envelope could not be parsed', function () {
    const { code, faultcode, faultstring, body } = parseFault({
      message: 'Request failed with status code 500',
      response: { data: MANAGED_OBJECT_NOT_FOUND },
    })

    assert.equal(code, 'ManagedObjectNotFound')
    assert.equal(faultcode, 'ServerFaultCode')
    // entities are decoded
    assert.match(faultstring, /^The object 'vim\.VirtualMachine:vm-42' has already been deleted/)
    assert.equal(body, MANAGED_OBJECT_NOT_FOUND)
  })

  it('reads a namespace prefixed fault from the raw body', function () {
    const { code, faultcode, faultstring, localizedMessage } = parseFault({
      response: { data: NAMESPACE_PREFIXED },
    })

    assert.equal(code, 'FileLocked')
    assert.equal(faultcode, 'ServerFaultCode')
    assert.equal(faultstring, 'Unable to access file since it is locked')
    assert.equal(localizedMessage, 'Unable to access file [ds1] vm/vm.vmdk since it is locked')
  })

  it('handles a `$value` wrapped text node', function () {
    const { faultstring } = parseFault({
      root: { Envelope: { Body: { Fault: { faultstring: { $value: 'boom' } } } } },
    })

    assert.equal(faultstring, 'boom')
  })

  it('does not throw on an error without any fault', function () {
    assert.deepEqual(parseFault(new Error('socket hang up')), {
      code: undefined,
      faultcode: undefined,
      faultstring: undefined,
      localizedMessage: undefined,
      body: undefined,
    })
    assert.deepEqual(parseFault(undefined).code, undefined)
  })

  it('ignores the placeholder body used by node-soap for streamed responses', function () {
    assert.equal(parseFault({ body: '<stream>' }).body, undefined)
  })
})
