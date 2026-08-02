# Packer plugin

## Introduction

[Packer](https://developer.hashicorp.com/packer) automates the creation of machine images: describe an image once in code, and rebuild it identically whenever needed. In an XCP-ng/Xen Orchestra environment, that means building **golden VM templates** (base OS, updates, guest tools, your provisioning) instead of preparing them by hand.

Vates maintains the [XenServer Packer plugin](https://github.com/vatesfr/packer-plugin-xenserver), a builder that installs an OS from an ISO on an XCP-ng host and turns the result into a reusable image. It was revived from an abandoned upstream project and is developed alongside the [Terraform provider](./terraform-provider.md) to ensure interoperability: templates built with Packer can then be cloned into VMs through the Terraform provider, the [REST API](../xo5/restapi.md), or the Xen Orchestra web interface.

:::note
The plugin talks **directly to an XCP-ng host** (via XAPI and SSH), not to the Xen Orchestra API. You point it at a host with its credentials; Xen Orchestra then sees and manages the resulting templates like any other.
:::

## Installation

Declare the plugin in your template and let `packer init` download it:

```hcl
packer {
  required_plugins {
    xenserver = {
      version = ">= v0.9.0"
      source  = "github.com/vatesfr/xenserver"
    }
  }
}
```

<Terminal shell title="download the declared plugins">{`
packer init .
`}</Terminal>

:::tip
Version `0.9.0` and later are validated against **XCP-ng 8.3**. Check the [releases page](https://github.com/vatesfr/packer-plugin-xenserver/releases) for the current version.
:::

## Minimal example

The plugin provides the `xenserver-iso` builder: it creates a VM on the target host, boots it from an ISO, runs the OS installation, then captures the result. A skeleton looks like this:

```hcl
source "xenserver-iso" "example" {
  # The XCP-ng host to build on
  remote_host     = "your-xcpng-host"
  remote_username = "root"
  remote_password = "your-password"

  # Installation media and VM shape
  iso_url      = "https://example.com/path/to/installer.iso"
  iso_checksum = "sha256:..."
  sr_name      = "Local storage"
  vm_name      = "packer-golden-image"
  vm_memory    = 4096
  disk_size    = 20480

  # How Packer connects to the VM to provision it
  ssh_username = "packer"
  ssh_password = "your-vm-password"
}

build {
  sources = ["xenserver-iso.example"]
}
```

<Terminal shell title="build the image">{`
packer build .
`}</Terminal>

A real template also needs the OS installer automated (kickstart, preseed, or cloud-init autoinstall, served to the VM during boot). Rather than duplicating that here, start from the maintained, complete [Ubuntu example](https://github.com/vatesfr/packer-plugin-xenserver/tree/master/examples) in the plugin repository.

## Going further

The [plugin repository](https://github.com/vatesfr/packer-plugin-xenserver) is the source of truth for the builder's options (ISO handling, storage and network selection, output formats, HTTP-served install files, and so on), its examples, and its releases. See also the [Packer documentation](https://developer.hashicorp.com/packer/docs) for general concepts like provisioners and variables.

## Related links

- [packer-plugin-xenserver on GitHub](https://github.com/vatesfr/packer-plugin-xenserver) (source of truth for options and examples)
- [Packer official documentation](https://developer.hashicorp.com/packer/docs)
- [Terraform provider](./terraform-provider.md), to deploy VMs from the templates you build
