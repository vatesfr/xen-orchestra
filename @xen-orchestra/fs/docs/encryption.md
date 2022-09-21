## metadata files

- Older remotes dont have any metadata file
- Remote used since 5.75 have two files : encryption.json and metadata.json

The metadata files are checked by the sync() method. If the check fails it MUST throw an error and dismount.

If the remote is empty, the `sync` method creates them

### encryption.json

A non encrypted file contain the algorithm and parameters used for this remote.
This MUST NOT contains the key.

### metadata.json

An encrypted JSON file containing the settings of a remote. Today this is an empty JSON file ( `{random: <randomuuid>}` ), it serves to check if the encryption key set in the remote is valid, but in the future will be able to store some remote settings to ease disaster recovery.

If this file can't be read (decrypted, decompressed, .. ), that means that the remote settings have been updated. If the remote is empty, update the `encryption.json` and `metadata.json` files , else raise an error.
