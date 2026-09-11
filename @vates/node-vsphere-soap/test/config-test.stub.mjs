// place your own credentials here for a vCenter or ESXi server: they are used by
// vsphere-soap.integ.mjs to connect to a real instance.
//
// copy this file next to it, as `config-test.mjs`. It is ignored by git, do not commit it.

export const vCenterTestCreds = {
  vCenterIP: 'vcsa',
  vCenterUser: 'vcuser',
  vCenterPassword: 'vcpw',
  vCenter: true,
}
