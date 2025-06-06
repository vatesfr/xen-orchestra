# Specifications for Remote form

## Azure

### Form

- type: Azure
- name: Label
- host type: azure/azurite (default: azure)
- https ou http only for azurite
- hostname:
  - if host type is azure: currently, if host type is azure, always is {username}.blob.core.windows.net (maybe a warning would be useful or a placeholder could be useful)
  - if host type is azurite, it usually has a port. Suggested placeholder: 127.0.0.1: 10000
- accountName: must be lowercase, to be encoded
- key: account password, can be anything, to be encoded to avoid weird escaping
- container: DNS name validation (`^((?!-)[A-Za-z0-9-]{1,63}(?<!-))`)
  - Container names must start or end with a letter or number, and can contain only letters, numbers, and the hyphen/minus (-) character.
  - Every hyphen/minus (-) character must be immediately preceded and followed by a letter or number; consecutive hyphens aren't permitted in container names.
  - All letters in a container name must be lowercase.
  - Container names must be from 3 through 63 characters long.
- path: Avoid directory names that end with a dot (.), a forward slash (/), a backslash (\), or a sequence or combination of the two. No path segments should end with a dot (.). Should start with a '/'

### Formatting

#### Azure

azure://{accountName}:{key}@{host}/{container}{path}  
**example:** azure://xodev123:password@xodev123.blob.core.windows.net/xodev/folder/to/backups

#### Azurite

azurite://{accountName}:{key}@{host}/{container}{path}  
**example:** azurite://xodev123:password@127.0.0.1:10000/xodev/folder/to/backups

#### Azurite in http

azurite+http://{accountName}:{key}@{host}/{container}{path}  
**example:** azurite+http://xodev123:password@127.0.0.1:10000/xodev/folder/to/backups
