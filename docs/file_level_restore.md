# File level restore

You can also restore specific files and directories inside a VM. It works with all your existing delta backups.

> You must use the latest XOA release. When you connect with the console, you should see `Build number: 16.12.20`. If you have this or higher (eg `17.*`), it means that's OK! Otherwise, please update your XOA.

> Restoring individual files from an SMB remote is not possible yet, but it's planned for the future!

> File level restore **is only possible on delta backups**

## Restore a file

Go into the Backup/File restore section:

![](https://xen-orchestra.com/blog/content/images/2016/12/filelevelrestore1.png)

Then, click on the VM where your files are, and follow the instructions:

![](https://xen-orchestra.com/blog/content/images/2016/12/filelevelrestore2.png)

That's it! Your chosen file will be restored.