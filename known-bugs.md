# Known bugs

XO is currently under development and contains various known bugs/limitations.

We will try to list the most important here so that you know what to expect if you try it and that we are planning to fix them :)

## Disks and networks edition in VM view

You can't currently modify disks and networks on a VM. Will be fixed as soon as we can.

## Lack of explicit error messages

Our error messages aren't really explicit. We need to fix that.

## Avoid aborted VM to stays in the template list

Due to the non-atomic process of VM creation in XAPI, if it fails, you'll have a template created with the name of the VM in your template list.

## RAM usage count in global statistic is wrong

But now, global RAM count is "fixed". We need to find why it doesn't work.
