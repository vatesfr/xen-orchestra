# Ansible dynamic inventory

## Introduction

Dynamic inventory is a powerful Ansible feature that discovers the hosts to manage from an external source instead of a static file. The [`community.general.xen_orchestra`](https://docs.ansible.com/ansible/latest/collections/community/general/xen_orchestra_inventory.html) inventory plugin connects to your **Xen Orchestra** instance and builds an inventory from the virtual machines (VMs) it manages, so your automation always targets the real state of your infrastructure.

:::tip
With dynamic inventory, there is no need to manually maintain static inventory files. Your VMs are automatically discovered and classified into groups based on their properties.
:::

## Prerequisites {#installing-prerequisites}

- a running **Xen Orchestra** instance connected to an **XCP-ng** pool
- Ansible with the `community.general` collection, version 4.1.0 or newer (the version that introduced the plugin)
- the `websocket-client` Python library, version 1.0.0 or newer (the plugin talks to the XO JSON-RPC API over a websocket)
- an XO **user account**: this plugin authenticates with a username and password (it does not support API tokens)

<Terminal shell title="install the requirements and check the plugin is available">{`
ansible-galaxy collection install community.general
pip install "websocket-client>=1.0.0"
ansible-doc -t inventory community.general.xen_orchestra
`}</Terminal>

## Configuring the inventory {#configuring-xen-orchestra-dynamic-inventory}

### Minimal configuration {#basic-configuration}

Create a configuration file for the dynamic inventory, for example `my.xen_orchestra.yml`:

```yaml
# my.xen_orchestra.yml
plugin: community.general.xen_orchestra
api_host: your-xo-hostname
user: your_username
password: your_password
use_ssl: true        # connect over wss:// (set to false for plain ws://)
validate_certs: true # set to false if XO uses a self-signed certificate
```

:::tip
The file name must end with `.xen_orchestra.yml` or `.xen_orchestra.yaml` for the plugin to load it.
:::

:::note
`api_host` takes a hostname or IP address, without a `ws://` or `wss://` prefix: the plugin builds the websocket URL itself from `use_ssl`. The connection settings can also come from the `ANSIBLE_XO_HOST`, `ANSIBLE_XO_USER`, and `ANSIBLE_XO_PASSWORD` environment variables.
:::

### Securing credentials {#using-ansible-vault}

:::warning
Never keep plain-text credentials in a file that reaches version control. In production, store them with Ansible Vault or pass them through the environment variables above.
:::

Create an encrypted file for your secrets:

<Terminal shell title="create an encrypted secrets file">{`
ansible-vault create vault.yml
`}</Terminal>

with the following content:

```yaml
# vault.yml
xo_host: your-xo-hostname
xo_user: your_username
xo_password: your_password
```

then reference these variables from the inventory configuration:

```yaml
# my.xen_orchestra.yml
plugin: community.general.xen_orchestra
api_host: "{{ xo_host }}"
user: "{{ xo_user }}"
password: "{{ xo_password }}"
use_ssl: true
validate_certs: true
```

:::tip
When using Ansible Vault, add `--ask-vault-pass` (or `--vault-password-file ~/.vault_pass.txt`) and `-e @vault.yml` to your commands.
:::

## Using the inventory {#using-dynamic-inventory}

<Terminal shell title="explore the inventory, then ping every VM">{`
ansible-inventory -i my.xen_orchestra.yml --list
ansible-inventory -i my.xen_orchestra.yml --graph
ansible-inventory -i my.xen_orchestra.yml --host=uuid-of-your-vm
ansible -i my.xen_orchestra.yml all -m ping
`}</Terminal>

`--list` dumps the whole inventory, `--graph` displays the groups as a tree, and `--host` shows the variables of a single VM (identified by its UUID in XO). For each VM, the plugin exposes its XO properties as host variables:

```json
{
    "ansible_host": "192.0.2.10",
    "cpus": 1,
    "has_ip": true,
    "ip": "192.0.2.10",
    "is_managed": true,
    "memory": 2147467264,
    "name_label": "XO Tutorial",
    "os_version": {
        "distro": "Ubuntu",
        "name": "Ubuntu 24.04",
        "uname": "6.8.0-57-generic"
    },
    "power_state": "running",
    "tags": [],
    "type": "VM",
    "uuid": "0ae54d06-e3e2-100c-00e8-46f67945e37c"
}
```

## Groups and host variables {#advanced-use-of-dynamic-inventory}

VMs are automatically grouped under their pool and host. On top of that, the plugin supports the standard constructed-inventory options: `groups` (conditional groups), `keyed_groups` (one group per property value), and `compose` (custom host variables), all evaluated against the host variables shown above.

```yaml
plugin: community.general.xen_orchestra
api_host: your-xo-hostname
user: your_username
password: your_password
use_ssl: true
validate_certs: true

# Conditional groups
groups:
  running: power_state == "running"
  halted: power_state == "halted"
  ubuntu: "'Ubuntu' in name_label"
  critical: "'critical' in tags"

# One group per value of a property
keyed_groups:
  - prefix: state
    key: power_state

# Custom host variables
compose:
  ansible_user: "'ubuntu' if 'Ubuntu' in name_label else 'root'"
  xo_vm_name: name_label
```

:::note
`power_state` is lowercase in the inventory (`running`, `halted`), even though XO displays `Running` and `Halted` in its UI.
:::

## Using it in playbooks {#use-in-ansible-playbooks}

Any group built by the inventory can be targeted in a playbook. This one updates every running Debian or Ubuntu VM, using the `running` group defined above:

```yaml
# update-running-vms.yml
---
- name: Update all running Debian and Ubuntu VMs
  hosts: running
  gather_facts: true
  become: true

  tasks:
    - name: Update package index and upgrade packages
      ansible.builtin.apt:
        update_cache: true
        upgrade: dist
      when: ansible_distribution in ["Ubuntu", "Debian"]

    - name: Check if a reboot is required
      ansible.builtin.stat:
        path: /var/run/reboot-required
      register: reboot_required
      when: ansible_distribution in ["Ubuntu", "Debian"]

    - name: Reboot if required
      ansible.builtin.reboot:
      when: reboot_required.stat.exists | default(false)
```

<Terminal shell title="run the playbook against the dynamic inventory">{`
ansible-playbook -i my.xen_orchestra.yml update-running-vms.yml
`}</Terminal>

## Troubleshooting {#troubleshooting-and-debugging}

1. **Connection problems**: check `api_host` (hostname only, no scheme), the credentials, and that `use_ssl` matches how your XO is exposed (HTTPS or plain HTTP).
2. **Empty inventory**: make sure the XO account can actually see the VMs (an unprivileged user only sees the objects it has access to).
3. **Missing `ansible_host`**: a VM without guest tools reports no IP address; `has_ip` is `false` and `ansible_host` stays empty.

For more detail, run the inventory in debug mode:

<Terminal shell title="dump the inventory with debug output">{`
ANSIBLE_DEBUG=1 ansible-inventory -i my.xen_orchestra.yml --list
`}</Terminal>

## Going further {#conclusion}

The [plugin documentation](https://docs.ansible.com/ansible/latest/collections/community/general/xen_orchestra_inventory.html) is the reference for every option (caching, `use_vm_uuid`, `use_host_uuid`, and more) and is always up to date with the collection, and the [plugin source code](https://github.com/ansible-collections/community.general/blob/main/plugins/inventory/xen_orchestra.py) is available in the `community.general` repository.

## Related links

- [xen_orchestra inventory plugin documentation](https://docs.ansible.com/ansible/latest/collections/community/general/xen_orchestra_inventory.html)
- [Plugin source code](https://github.com/ansible-collections/community.general/blob/main/plugins/inventory/xen_orchestra.py)
- [Ansible documentation on dynamic inventories](https://docs.ansible.com/ansible/latest/inventory_guide/intro_dynamic_inventory.html)
- [VirtOps #3: Ansible with Xen Orchestra (blog post)](https://xen-orchestra.com/blog/virtops3-ansible-with-xen-orchestra/)
- [XCP-ng Forum](https://xcp-ng.org/forum/)
