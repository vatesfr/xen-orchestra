# Ansible dynamic inventory

## Introduction

Dynamic inventory is a powerful Ansible feature that enables you to automatically discover hosts to manage from an external source. With **Xen Orchestra**, you can now use dynamic inventory to automatically discover and manage your virtual machines (VMs) directly from your virtualized infrastructure.

This guide will show you how to configure Xen Orchestra's dynamic inventory and automate the management of your VM fleet.

:::note
This guide is designed for [Ansible](https://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html) version 2.19 or higher and requires the `community.general` collection.
:::

:::tip
With dynamic inventory, there is no need to manually maintain static inventory files. Your VMs are automatically discovered and classified into groups based on their properties.
:::

## Configuring Xen Orchestra Dynamic Inventory

### Installing prerequisites

Ensure that you have the `community.general` collection installed.

```bash
# Install the community.general collection
ansible-galaxy collection install community.general

# Verify the installation
ansible-doc -t inventory community.general.xen_orchestra
```
### Basic configuration

1. **Create a configuration file for the dynamic inventory: `test.xen_orchestra.yaml`**

:::tip 
Please note that the plugin configuration file must end with one of the following extensions: `xen_orchestra.yml` or `xen_orchestra.yaml` (e.g. `test.xen_orchestra.yml`)
:::

```yaml
# xen orchestra connection
plugin: community.general.xen_orchestra
api_host: ws://your-xo-hostname
user: your_username
password: your_password
validate_certs: false
use_ssl: false

# Automatic groups
groups:
  running: power_state == “Running”
  halted: power_state == “Halted”
  windows: “‘Windows’ in name_label”
  linux: “‘Linux’ in name_label” or “‘Ubuntu’ in name_label” or “‘CentOS’ in name_label” or “‘Debian’ in name_label”

# Compound variables
compose:
  ansible_host: ipv4_addresses[0] if ipv4_addresses else None
  ansible_user: “root”
  xo_vm_name: name_label
  xo_pool: pool_name
```

:::warning
For security reasons, we recommend using environment variables or Ansible Vault to store credentials.
:::

2. **Configuration with environment variables**

```yaml
plugin: community.general.xen_orchestra
api_host: “{{xen_api_host}}”
user: “{{ xen_api_user }}”
password: “{{ xen_api_password }}”
validate_certs: true
use_ssl: false
```

Use Ansible Vault to create an encrypted file for your secrets:

```bash
ansible-vault create vault.yml
```
and place the contents:
```yaml
xen_api_user: your_user
xen_api_password: your_password
xen_api_host: your-xo-hostname
```

## Using dynamic inventory

1. **Test dynamic inventory**

```yaml
# List all hosts
ansible-inventory -i xo_inventory.yaml --list 

# Display groups in tree form
ansible-inventory -i xo_inventory.yaml --graph

# Provides information about a specific host (VM UUID in XO)
ansible-inventory -i xo_inventory.yaml --host=uuid-of-your-vm
```

:::tip
 If you are using Ansible Vault, don't forget to add `--ask-vault-pass` to the end of your commands.
If you are using a vault password file, you can avoid typing the password each time by adding `--vault-password-file ~/.vault_pass.txt` to the end of your commands.
:::

2. **Example output**

```json
{
    "ansible_host": null,
    "cpus": 1,
    "has_ip": false,
    "ip": null,
    "is_managed": true,
    "memory": 21474xxx,
    "name_label": "XO Tutorial",
    "os_version": {
        "distro": "Ubuntu",
        "name": "Ubuntu 24.04",
        "uname": "6.8.0-57-generic"
    },
    "power_state": "running",
    "tags": [],
    "type": "VM",
    "uuid": "0ae54d06-xxx-100c-00e8-xxxxxxx",
    "xo_power_state": "running",
    "xo_vm_name": "XO Tutorial"
}
```

## Advanced Use of Dynamic Inventory

### Filtering VMs

You can filter the VMs included in the inventory:

```yaml
plugin: community.general.xen_orchestra
api_host: ws://your-xo-hostname
user: your_user
password: your_password
validate_certs: true
use_ssl: false

# Filters
filters:
  - pool_name == “Production”
  - power_state == “Running”
  - name_label != “template-*”

# Exclusive filter
strict: false
```

### Complex custom groups

Create groups based on complex conditions:

```yaml
plugin: community.general.xen_orchestra
api_host: ws://your-xo-hostname
username: your_username
password: your_password
validate_certs: true
use_ssl: false

groups:
  # By state
  powered_on: power_state == “Running”
  powered_off: power_state == “Halted”
  
  # By operating system
  ubuntu_servers: “‘Ubuntu’ in name_label and ‘server’ in name_label.lower()”
  web_servers: “‘web’ in name_label.lower() or ‘apache’ in name_label.lower() or ‘nginx’ in name_label.lower()”
  db_servers: “‘db’ in name_label.lower() or ‘database’ in name_label.lower() or ‘mysql’ in name_label.lower() or ‘postgres’ in name_label.lower()”
  
  # By pool
  production_vms: pool_name == “your_production_name”
  development_vms: pool_name == “your_development_name”
  lab_vms: “pool_name == ‘Main Lab’”

  
  # By tags (if your XO uses tags)
  critical_vms: "' critical' in tags" if tags is defined else false
  backup_excluded: “‘no-backup’ in tags” if tags is defined else false

keyed_groups:
  # Creates groups by pool
  - prefix: pool
    key: pool_name
  
  # Creates groups by VM template
  - prefix: template
    key: template_name
```

### Configuring host variables

Customize Ansible variables for each host:

```yaml
plugin: community.general.xen_orchestra
api_host: ws://your-xo-hostname
user: your_user
password: your_password
validate_certs: true
use_ssl: false

compose:
  # Sets ansible_host as the first IPv4 address
  ansible_host: |
    {% if ipv4_addresses and ipv4_addresses[0] %}
      {{ ipv4_addresses[0] }}
    {% else %}
      {{ name_label | lower | replace(' ', '-') }}.local
    {% endif %}
  
  # Sets the user based on the operating system
  ansible_user: |
    {% if ‘Windows’ in name_label %}
    administrator
    {% elif ‘Ubuntu’ in name_label %}
    ubuntu
    {% elif ‘CentOS’ in name_label %}
    centos
    {% else %}
    root
    {% endif %}
  
  # Xen Orchestra custom variables
  xo_vm_id: id
  xo_vm_name: name_label
  xo_pool: pool_name
  xo_template: template_name
  xo_power_state: power_state
  xo_memory: memory_max
  xo_cpus: cpus

# Default variables
vars:
  ansible_connection: ssh
  ansible_ssh_common_args: '-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null'
  xo_inventory_source: “xen_orchestra”
```

## Use in Ansible Playbooks

### Playbook with dynamic inventory

```yaml
# playbook-xo-maintenance.yaml
---
- name: VM maintenance via XO inventory
  hosts: uuid_of_your_vm # you can use (all/group_label/statut_vm/...)
  gather_facts: true
  become: yes

  tasks:
    - name: Update package index
      apt:
        update_cache: yes
        cache_valid_time: 3600
      when: ansible_distribution in [“Ubuntu”, “Debian”]

    - name: Update system packages
      apt:
        name: “*”
        state: latest
      when: ansible_distribution in [“Ubuntu”, “Debian”]
      register: apt_upgrade

    - name: Check if a reboot is required
      stat:
        path: /var/run/reboot-required
      register: reboot_required_file
      when: ansible_distribution in [“Ubuntu”, “Debian”]

    - name: Reboot if necessary
      reboot:
        msg: “Reboot after update”
        connect_timeout: 5
        reboot_timeout: 300
        pre_reboot_delay: 0
        post_reboot_delay: 30
        test_command: uptime
      when: reboot_required_file.stat.exists

    - name: Clean up package cache
      apt:
        autoclean: yes
        autoremove: yes
      when: ansible_distribution in [“Ubuntu”, “Debian”]
```

### Managing VMs by group

```yaml
# manage-vm-groups.yaml
---
- name: Configuring application servers
  hosts: group_label
  gather_facts: true
  become: yes

  tasks:
    - name: Installing basic packages
      apt:
        name:
          - curl
          - wget
          - htop
          - net-tools
        state: present
        update_cache: yes

    - name: Timezone configuration
      timezone:
        name: Europe/Paris

    - name: Creation of custom motd file
      copy:
        content: |
          VM managed by Ansible via Xen Orchestra
          Template: {{ xo_template }}
          Pool: {{ xo_pool }}
        dest: /etc/motd
        owner: root
        group: root
        mode: 0644

- name: Maintain specific VMs
  hosts: lab_vms
  gather_facts: true
  become: yes

  tasks:
    - name: Check disk space
      shell: df -h /
      register: disk_usage

    - name: Check memory usage
      shell: free -h
      register: memory_usage

    - name: Display system information
      debug:
        msg: |
          VM: {{ xo_vm_name }}
          Disk: {{ disk_usage.stdout_lines[1] if disk_usage.stdout_lines|length > 1 else ‘N/A’ }}
          Memory: {{ memory_usage.stdout_lines[1] if memory_usage.stdout_lines|length > 1 else ‘N/A’ }}
```

### Monitoring and Reporting Playbook

```yaml
# monitoring-playbook.yaml
---
- name: Collect information from XO VMs
  hosts: uuid_of_your_vm # use 'all' if you want to target all VMs
  gather_facts: true
  become: yes

  tasks:
    - name: Collect detailed information
      setup:
        gather_subset:
          - hardware
          - network
          - virtual

    - name: Check memory usage
      shell: free -m | awk 'NR==2{printf "%.2f%%", $3*100/$2 }'
      register: memory_usage

    - name: Check CPU usage
      shell: top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1
      register: cpu_usage

    - name: Check uptime
      shell: uptime -p
      register: uptime

    - name: Create XO report
      local_action:
        module: copy
        content: |
          XEN ORCHESTRA REPORT - {{ ansible_date_time.iso8601 }}
          ===================================================
          {% for host in groups['all'] %}
          VM: {{ hostvars[host].xo_vm_name }}
          UUID: {{ hostvars[host].xo_vm_id }}
          IP: {{ hostvars[host].ansible_host }}
          Hostname: {{ hostvars[host].ansible_hostname }}
          Memory: {{ hostvars[host].memory_usage.stdout }}
          CPU: {{ hostvars[host].cpu_usage.stdout }}%
          Uptime: {{ hostvars[host].uptime.stdout }}
          Pool: {{ hostvars[host].xo_pool }}
          Template: {{ hostvars[host].xo_template }}
          Status: {{ hostvars[host].xo_power_state }}
          ------------------------------------------
          {% endfor %}
        dest: "./xo-report-{{ ansible_date_time.epoch }}.txt"
      run_once: true

    - name: Monitoring summary
      debug:
        msg: |
          XO monitoring completed
          Report generated: xo-report-{{ ansible_date_time.epoch }}.txt
          {{ groups['all'] | length }} VMs inventoried
```

## Best Practices and Security

### Using Ansible Vault

:::warning
Always secure your credentials with Ansible Vault in production environments to prevent unauthorized access and sensitive data leaks. Failing to protect secrets can expose passwords, API keys, and other confidential information, putting your infrastructure and data at risk.
:::

1. **Create a secure vault file**

```bash
ansible-vault create vault.yaml
```

```yaml
xen_api_user: your_username
xen_api_password: your_password
xen_api_host: your-xo-hostname
```

2. **Inventory configuration with vault**

```yaml
plugin: community.general.xen_orchestra
api_host: "{{xen_api_host}}"
user: "{{ xen_api_user }}"
password: "{{ xen_api_password }}"
validate_certs: true
use_ssl: false
```

3. **Execution with vault**

```bash
ansible-inventory -i test.xen_orchestra.yaml --list --ask-vault-pass
```

### Managing Multiple Environments

Create inventory configurations per environment:

```yaml
plugin: community.general.xen_orchestra
api_host: ws://xo-production.company.com
user: "{{ vault_xo_user }}"
password: "{{ vault_xo_password }}"
filters:
  - pool_name == "your_pool_name"
```

## Troubleshooting and Debugging

### Testing and Validation

```bash
ansible-inventory -i your_file.xen_orchestra.yml --list

ANSIBLE_DEBUG=1 ansible-inventory -i your_file.xen_orchestra.yml --list

ansible-inventory -i your_file.xen_orchestra.yml --host=uuid-vm-specific

ansible -i your_file.xen_orchestra.yml all -m ping
```

### Common Issue Resolution

1. **Connection Problems**
    - **Error**: Unable to connect to the Xen Orchestra API.
    - **Reason**: Incorrect URL or credentials.
    - **Solution**: Check the URL and credentials.
    ```bash
    # Verify URL and credentials
    ANSIBLE_DEBUG=1 ansible-inventory -i your_file.xen_orchestra.yml --list
    ```

2. **VMs Not Found**
    - **Error**: No VMs found in inventory.
    - **Reason**: Applied filters may be excluding all VMs.
    - **Solution**: Check the applied filters.
    ```yaml
    filters:
      - power_state == "Running"
    strict: false
    ```

3. **Variable Issues**
    - **Error**: Undefined or incorrect variables.
    - **Reason**: Issues with variable definitions in the configuration file.
    - **Solution**: Ensure all variables are properly defined.
    ```yaml
    compose:
      ansible_host: ipv4_addresses[0] if ipv4_addresses else "unknown"
      ansible_user: "{{ 'ubuntu' if 'Ubuntu' in name_label else 'root' }}"
    ```

## Conclusion

The Xen Orchestra dynamic inventory for Ansible provides a powerful and automated method to manage your virtualized infrastructure. By eliminating manual inventory maintenance, you gain agility, reliability, and efficiency.

## Related links

- [Dynamic inventory source code](https://github.com/ansible-collections/community.general/blob/main/plugins/inventory/xen_orchestra.py)
- [Ansible documentation on dynamic inventories](https://xen-orchestra.com/blog/virtops3-ansible-with-xen-orchestra/)
- [community.general collection](https://docs.ansible.com/ansible/latest/collections/community/general/xen_orchestra_inventory.html)
- [XCP-ng Forum](https://xcp-ng.org/forum/)
