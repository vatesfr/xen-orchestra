```
Usage:

  xo-upload-ova --register [--expiresIn duration] <XO-Server URL> <username> [<password>]
    Registers the XO instance to use.

    --expiresIn duration
      Can be used to change the validity duration of the
      authorization token (default: one month).

  xo-upload-ova --unregister
    Remove stored credentials.

  xo-upload-ova --inspect <file>
    Displays the data that would be imported from the ova.

  xo-upload-ova --upload <file> <sr> [--override <key>=<value> [<key>=<value>]+]
    Actually imports the VM contained in <file> to the Storage Repository <sr>.
    Some parameters can be overridden from the file, consult --inspect to get the list.
    Note: --override has to come last. By default arguments are string, prefix them with <json:> to type
    them, ex. " --override nameLabel='new VM'  memory=json:67108864 disks.vmdisk1.capacity=json:134217728"

xo-upload-ova v0.1.0

```

#### Register your XO instance

```
> xo-upload-ova --register http://xo.my-company.net admin@admin.net admin
Successfully logged with admin@admin.net
```

Note: only a token will be saved in the configuration file.

#### Import your .ova file

```
> xo-upload-ova --upload dsl.ova a7c630bf-b38c-489e-d3c3-e62507948980 --override 'nameLabel=dsl ' descriptionLabel='short desc' memory=json:671088640 disks.vmdisk1.descriptionLabel='disk description' disks.vmdisk1.capacity=json:1342177280
```
