---
sidebar_label: RBAC
---

# RBAC: Role-Based Access Control

RBAC is the access control system for the Xen Orchestra [REST API](automation/restapi.md) and the XO 6 interface. It lets you define exactly what each user or group can see and do, down to individual objects, without granting them full administrator access.

:::note Where RBAC applies, and why it was once called "ACL v2"
RBAC covers the **[REST API](automation/restapi.md)** and **XO 6**. The JSON-RPC API behind the XO 5 interface keeps the original [ACL system](xo5/users.md#acls), and those ACLs are not available on the REST API.

You may still come across this feature under the name **ACL v2**. That was only a working name while it was being built. It is a full rewrite of the original ACLs into a much broader model, so it is now called by what it actually is: RBAC. Same feature, current name.
:::

## What changed from the original ACLs

The original [ACL system](xo5/users.md#acls) allowed granting access to individual objects (a VM, an SR…). Simple, but limited: there was no way to say _"this user can shutdown only VMs tagged `qa`"_. It also only covered **XAPI objects**: VMs, hosts, SRs, networks. Users, groups, backups, schedules, and jobs were out of scope.

RBAC introduces a full role-based model with effects, selectors, and an action hierarchy, covering the entire infrastructure including XO management objects.

:::info
On XOA, RBAC is included in the **Essential+**, **Pro** and **Enterprise** bundles. Installations from the sources are not restricted.
:::

---

## Core concepts

### How it works

RBAC follows a **deny-by-default** model:

- XOA admins always have full access, regardless of any ACL configuration.
- Non-admin users start with **zero access**. They can only access objects they have been explicitly granted permission to.
- A `deny` privilege always takes precedence over an `allow` privilege on the same action + resource + object combination.

The system is built around two building blocks:

| Concept       | Description                                                                                                             |
| ------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Role**      | A named container for privileges.                                                                                       |
| **Privilege** | A rule inside a role: which action is allowed (or denied) on which resource, and optionally on which subset of objects. |

### Roles

A role is just a label with a collection of privileges. You create a role once, add privileges to it, then assign it to as many users or groups as needed.

A user's effective privileges are the union of all privileges from all their direct roles and the roles of their groups.

### Privileges

A privilege defines:

- **resource**: the type of object (e.g. `vm`, `backup-job`, `sr`)
- **action**: what operation is allowed or denied (e.g. `read`, `start`, `delete`)
- **effect**: whether the privilege grants (`allow`) or blocks (`deny`) the action
- **selector** _(optional)_: a filter expression to restrict the privilege to a subset of objects ([complex-matcher format](xo5/manage_infrastructure.md#filter-syntax))

### Action hierarchy

Actions use a `:` separator to form a hierarchy. A broader action automatically covers its children:

| Privilege action | Covers                                 |
| ---------------- | -------------------------------------- |
| `shutdown`       | `shutdown:clean` and `shutdown:hard`   |
| `reboot`         | `reboot:clean` and `reboot:hard`       |
| `update`         | `update:tags`, `update:datasources`, … |
| `*`              | every action on the resource           |

The reverse is not true: granting `shutdown:clean` does **not** grant `shutdown:hard`.

---

## Built-in template roles

Xen Orchestra ships with eight ready-to-use role templates. They are **immutable** and automatically kept up to date on startup: they cannot be modified, deleted, or assigned directly.

To use them, **copy** a template into a new role and assign that copy to your users or groups. This ensures the built-in templates always stay up to date without affecting your custom configuration.

| Role                        | Description                                                                                                                                 |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Read only**               | Read access to the entire infrastructure and all XO objects. Cannot modify anything.                                                        |
| **VMs power state manager** | Can start, stop, reboot, pause, suspend, resume, and unpause VMs.                                                                           |
| **VMs creator**             | Can instantiate VM templates and create VDIs and VIFs.                                                                                      |
| **VMs read only**           | Can only list and view VMs.                                                                                                                 |
| **VMs administrator**       | Full control over VM actions, plus read access to VM snapshots.                                                                             |
| **Network administrator**   | Scoped admin for networking: manages networks and VIFs, creates pool networks, reads and updates PIFs, and views pools, hosts and VMs.      |
| **Storage administrator**   | Scoped admin for storage: full control over SRs, VDIs, VBDs, PBDs and backup repositories, read access to unmanaged VDIs and storage managers. |
| **Administrator**           | Full access to the entire infrastructure and all XO objects.                                                                                |

The **Administrator** template and the two scoped administrator roles below were introduced in Xen Orchestra 6.6.

### Scoped administrator roles

The two scoped admin templates let you delegate a whole functional area (storage or networking) without handing out global admin rights. Here is exactly what each template grants:

**Storage administrator**

| Resource                                       | Access                                                                                    |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `sr`, `vdi`, `vbd`, `pbd`, `backup-repository` | Every action (`*`): read, create, delete, connect/plug, scan, migrate, resize, and so on. |
| `vdi-unmanaged`, `sm`                          | Read only.                                                                                |

In practice, a Storage administrator can create and delete SRs, manage virtual disks and their attachments on both hosts and VMs, plug or unplug PBDs, and fully manage backup repositories (create, forget, benchmark, update), while the rest of the infrastructure stays out of reach.

**Network administrator**

| Resource  | Access                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------ |
| `network` | Every action (`*`): read, create, delete, update tags and `other_config`.                        |
| `vif`     | Every action (`*`): read, create, delete, connect, disconnect, update locking mode, rate limit… |
| `pool`    | `read` and `create:network` (create networks at the pool level, including bonded and internal).  |
| `pif`     | `read` and `update` (e.g. reconfigure the management interface).                                 |
| `host`    | Read only.                                                                                       |
| `vm`      | Read only.                                                                                       |

A Network administrator can therefore manage the whole network stack, from pool networks down to individual VM interfaces, while hosts and VMs themselves remain visible but untouchable.

To copy a template into an assignable role, use `POST /rest/v0/acl-roles/<template-id>/actions/copy`:

<UiDetail src="/img/xo6/swagger-role-copy.png" alt="The copy action on a template role, in the REST API Swagger UI" width={620} />

---

## Self endpoints

Some endpoints are always accessible to a logged-in user **without any ACL privilege**, as they only expose information about the user themselves:

| Endpoint                                       | Description                                 |
| ---------------------------------------------- | ------------------------------------------- |
| `GET /rest/v0/users/me`                        | Get your own user profile                   |
| `GET /rest/v0/users/me/acl-privileges`         | List your own privileges                    |
| `GET /rest/v0/users/me/authentication_tokens`  | List your own authentication tokens         |
| `POST /rest/v0/users/me/authentication_tokens` | Create an authentication token for yourself |

`me` is a convenience alias: it is automatically redirected to `/rest/v0/users/{your-id}`.

This is how delegation works end to end: any user, whatever their privileges, can create their own [authentication token](automation/restapi.md#authentication) and use it to call the REST API within the limits of their roles.

:::tip
The Swagger UI available at `/rest/v0/swagger` documents every endpoint with its required privileges. Endpoints with no declared privilege are admin-only.
:::

---

## Supported resources and actions

Actions are written using the exact string you pass in a privilege. A parent action (e.g. `reboot`) is a shortcut that covers all its children, see [Action hierarchy](#action-hierarchy).

### Infrastructure resources

| Resource        | Available actions                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vm`            | `read`, `clone`, `delete`, `migrate-send`, `export`, `pause`, `start`, `resume`, `revert-snapshot`, `snapshot`, `suspend`, `unpause`, `reboot:clean`, `reboot:hard`, `shutdown:clean`, `shutdown:hard`, `update:affinityHost`, `update:autoPoweron`, `update:blockedOperations`, `update:coresPerSocket`, `update:cpuCap`, `update:cpuMask`, `update:cpuWeight`, `update:cpus`, `update:cpusStaticMax`, `update:creation`, `update:datasources`, `update:expNestedHvm`, `update:hasVendorDevice`, `update:highAvailability`, `update:hvmBootFirmware`, `update:memory`, `update:memoryMax`, `update:memoryMin`, `update:memoryStaticMax`, `update:nameDescription`, `update:nameLabel`, `update:nestedVirt`, `update:nicType`, `update:notes`, `update:PV_args`, `update:resourceSet`, `update:secureBoot`, `update:share`, `update:startDelay`, `update:suspendSr`, `update:tags`, `update:uefiMode`, `update:vga`, `update:videoram`, `update:viridian`, `update:virtualizationMode`, `update:xenStoreData` |
| `vm-snapshot`   | `read`, `delete`, `export`, `update:tags`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `vm-template`   | `read`, `delete`, `export`, `instantiate`, `update:tags`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `vm-controller` | `read`, `update:tags`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `vdi`           | `read`, `create`, `delete`, `boot`, `export-content`, `import-content`, `migrate-send`, `update:name_description`, `update:name_label`, `update:size`, `update:tags`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `vdi-snapshot`  | `read`, `delete`, `export`, `update:tags`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `vdi-unmanaged` | `read`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `vif`           | `connect`, `create`, `delete`, `disconnect`, `read`, `update:allowedIpv4Addresses`, `update:allowedIpv6Addresses`, `update:lockingMode`, `update:rateLimit`, `update:txChecksumming`,`update:other_config`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `vbd`           | `read`, `create`, `delete`, `connect`, `disconnect`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `sr`            | `read`, `create`, `delete`, `forget`, `migrate-receive`, `reclaim-space`, `scan`, `import:vdi`, `import:vm`, `update:tags`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `host`          | `read`, `allow-vm`, `join-pool`, `export:logs`, `update:tags`, `migrate-receive`, `disable`, `enable`, `evacuate`, `detach`, `shutdown:clean`, `shutdown:emergency`, `forget`, `reboot:clean`, `reboot:smart`, `restart-toolstack`, `start`, `scan-pifs`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `pool`          | `add-host`, `read`, `emergency-shutdown`, `rolling-reboot`, `rolling-update`, `create:network`, `create:vm`, `update:tags`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `network`       | `read`, `create`, `delete`, `update:tags`,`update:other_config`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `pif`           | `read`, `update:management`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `pbd`           | `read`, `plug`, `unplug`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `pci`           | `read`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `pgpu`          | `read`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `vgpu`          | `read`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `vgpuType`      | `read`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `vtpm`          | `read`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `sm`            | `read`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `gpuGroup`      | `read`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

### XO management resources

| Resource            | Available actions                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `backup-job`        | `read`                                                                                                                   |
| `backup-archive`    | `read`                                                                                                                   |
| `backup-log`        | `read`                                                                                                                   |
| `backup-repository` | `benchmark`, `create`, `read`, `forget`, `update:enabled`, `update:name`, `update:options`, `update:proxy`, `update:url` |
| `schedule`          | `read`, `run`                                                                                                            |
| `restore-log`       | `read`                                                                                                                   |
| `proxy`             | `read`                                                                                                                   |
| `server`            | `read`, `create`, `delete`, `connect`, `disconnect`                                                                      |
| `task`              | `read`, `abort`, `delete`                                                                                                |
| `alarm`             | `read`                                                                                                                   |
| `message`           | `read`                                                                                                                   |

### User management resources

| Resource        | Available actions                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| `user`          | `read`, `create`, `delete`, `update:name`, `update:password`, `update:permission`, `update:preferences` |
| `group`         | `read`, `create`, `delete`, `update:name`, `update:users`                                               |
| `acl-role`      | `read`, `create`, `delete`, `update:name`, `update:description`, `update:users`, `update:groups`        |
| `acl-privilege` | `read`, `create`, `delete`, `update:action`, `update:effect`, `update:resource`, `update:selector`      |

Note the last two rows: RBAC configuration is itself covered by the model. You do not need to be a full administrator to manage roles and privileges; a user holding the right `acl-role` and `acl-privilege` privileges can delegate access in turn, through the REST API.

---

## Concrete examples

### Alice: QA operator scoped to tagged VMs

> Alice needs to start and stop VMs in her test environment, but must not touch anything in production.

Create a `QA Operator` role, then POST each of these privileges to `/rest/v0/acl-privileges`:

```json
{ "resource": "vm", "action": "read",     "effect": "allow", "selector": "tags:qa", "roleId": "169020fd-4d5e-45fc-a26c-23153df00dcf" }
{ "resource": "vm", "action": "start",    "effect": "allow", "selector": "tags:qa", "roleId": "169020fd-4d5e-45fc-a26c-23153df00dcf" }
{ "resource": "vm", "action": "shutdown", "effect": "allow", "selector": "tags:qa", "roleId": "169020fd-4d5e-45fc-a26c-23153df00dcf" }
```

`roleId` is the id returned when the role was created, as shown in the [walkthrough](#walkthrough-creating-and-assigning-a-role) below. The next two examples omit it and show the privilege itself only.

Attach the role to Alice. She can now manage QA VMs only. Any attempt on a VM without the `qa` tag is blocked with a 403.

:::tip Selectors are evaluated dynamically
If someone adds the `qa` tag to an existing VM, it immediately appears in Alice's scope.
This means a single tag change is enough to grant or revoke access to a resource, with no need to touch roles or privileges at all.
:::

---

### Bob: Snapshot only running VMs

> Bob is allowed to snapshot VMs, but only while they are running, to avoid snapshotting stopped VMs that may be part of an automated maintenance process.

Create a `Running VM Snapshot` role with these privileges:

```json
{ "resource": "vm", "action": "read",     "effect": "allow", "selector": "power_state:Running" }
{ "resource": "vm", "action": "snapshot", "effect": "allow", "selector": "power_state:Running" }
```

Bob can see and snapshot any running VM. Stopped VMs are completely invisible to him.

---

### Carol: Full VM access except production

> Carol can do everything on VMs, except touch anything tagged `prod`.

Create a `Full VM Access (non-prod)` role with these privileges. The `*` wildcard grants every action on a resource at once. Pair it with a `deny` to carve out an exception (`deny` always wins):

```json
{ "resource": "vm", "action": "*",    "effect": "allow" }
{ "resource": "vm", "action": "*",    "effect": "deny",  "selector": "tags:prod" }
```

Carol can start, stop, delete, snapshot any VM she wants. Production VMs are completely invisible to her: they never appear in her lists and any direct attempt returns a 403.

---

## Walkthrough: creating and assigning a role

### Step 1: Create a role {#step-1--create-a-role}

<UiDetail src="/img/xo6/swagger-create-role.png" alt="Creating a custom role through POST /acl-roles" width={480} />

Response:

```json
{ "id": "e4b1f3c2-1234-5678-abcd-000000000001" }
```

### Step 2: Add privileges to the role {#step-2--add-privileges-to-the-role}

<UiDetail src="/img/xo6/swagger-create-privilege.png" alt="Attaching a privilege to a role through POST /acl-privileges" width={480} />

### Step 3: Assign the role to the user {#step-3--assign-the-role-to-the-user}

<UiDetail src="/img/xo6/swagger-add-user-to-role.png" alt="Adding a user to a role" width={480} />

The user can now list VMs.

To assign to a group instead (all group members inherit the role):

<UiDetail src="/img/xo6/swagger-add-group-to-role.png" alt="Adding a group to a role" width={480} />

---

## Role management endpoints

Everything shown in the walkthrough (and more) is available as plain REST calls, ready for automation. All endpoints live under `/rest/v0/` and are protected by the matching `acl-role` or `acl-privilege` privileges:

| Endpoint                                       | Description                                                    |
| ---------------------------------------------- | --------------------------------------------------------------- |
| `GET` / `POST /acl-roles`                      | List roles / create a role                                     |
| `GET` / `PATCH` / `DELETE /acl-roles/:id`      | Read, rename or delete a role                                  |
| `POST /acl-roles/:id/actions/copy`             | Copy a role (the only way to use a template)                   |
| `GET /acl-roles/:id/privileges`                | List the privileges of a role                                  |
| `PUT` / `DELETE /acl-roles/:id/users/:userId`  | Assign the role to a user / remove it                          |
| `PUT` / `DELETE /acl-roles/:id/groups/:groupId`| Assign the role to a group / remove it                         |
| `GET /acl-roles/:id/users`                     | List the users holding a role _(XO 6.7)_                       |
| `GET /acl-roles/:id/groups`                    | List the groups holding a role _(XO 6.7)_                      |
| `GET /groups/:id/acl-roles`                    | List the roles of a group _(XO 6.7)_                           |
| `GET` / `POST /acl-privileges`                 | List privileges / create a privilege inside a role             |
| `GET` / `PATCH` / `DELETE /acl-privileges/:id` | Read, update or delete a privilege                             |

In the XO 6 interface, the **Administration** section of the sidebar covers users and groups; role and privilege management itself currently happens through the REST API, as shown above. See [Users and administration](xo6/management.md#users-and-administration).

<UiShot light="/img/xo6/administration-light.png" dark="/img/xo6/administration-dark.png" alt="The Administration section in XO 6, where users and groups are managed" url="https://your-xo/v6/#/admin/user-management/users" />

---

## Selectors

By default, a privilege applies to **all** objects of the given resource type. The optional `selector` field narrows it down using the [complex-matcher](xo5/manage_infrastructure.md#filter-syntax) syntax, the same filter syntax used in the XO UI.

A selector is evaluated against each object's properties. If it matches, the privilege applies; otherwise it does not.

### Common selector patterns

| Goal                           | Selector example              |
| ------------------------------ | ----------------------------- |
| A specific object by its ID    | `id: <uuid>`                  |
| All objects in a pool          | `$pool: <pool-uuid>`          |
| VMs tagged with a label        | `tags: <tag>`                 |
| VMs by power state             | `power_state: Running`        |
| VMs created by a specific user | `creation:creator: <user-id>` |

---

## Tips

- **Start minimal.** Add only the privileges a user actually needs. It is easy to add more later.
- **Use groups.** Assigning a role to a group avoids repeating the same assignment for every user.
- **Combine `allow` and `deny`.** When a user needs broad access with specific exceptions, grant with a wildcard privilege and carve out exceptions with `deny` + a selector.
- **Template roles are immutable.** Copy them first before customizing.
- **Delegate the delegation.** Grant `acl-role` and `acl-privilege` privileges to trusted operators so they can manage access themselves, without full admin rights.
- **Endpoint permissions** are visible in the Swagger UI (`/rest/v0/swagger`). Endpoints without a declared privilege require admin access.
