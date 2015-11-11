# Resources delegation

This chapter is about how to delegate resources (VM, hosts) to other users.

The idea is to allow external users (not admins) to:

* interact only with their objects
* delegate VMs to your dev teams...
* ... or to your clients

## Concepts

There is 2 types of XO users:

* admins, with all rights on all connected resources
* users, with no right by default

Permissions will thus apply on "users". Any account created by an external authentication process (LDAP, SSO...) will be a **user** without any permission.

All users will land on the "flat" view, which display no hierarchy, only all their visible objects (or no object if they are not configured).

## ACLs

## LDAP

## SSO