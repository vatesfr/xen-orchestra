### Deploy new appliance

First step, you have to deploy a new appliance. All needed information [here](installation.md)

### Export configuration

For export your current configuration you have to go to **Settings** -> **Config**.
Here you will see a named button **_Dowload current config_**. Click on it, then an export modal will appear.

![](./assets/exportModal.png)

You can set passphrase to encrypt the exported configuration.

### Import configuration

Now its time to import your configuration to the new appliance.
Go to **Settings** -> **Config** of your new appliance. Here you have a **_import_** section where you can drag and drop your exported configuration.

![](./assets/importModal.png)

When your configuration are loaded, click to import. New modal will appear for ask you the passphrase to decrypte your configuration. If you didn't set passphrase when you was exporting your configuration, let it empty.

### Advanced users

If you set some configuration on `/etc/xo-server` unfortunately you will have to migrate manually this configuration on the new appliance.
