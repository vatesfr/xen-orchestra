> This file describe how XO extract files from a VHD file.

## Expose VHD disk as block device

```console
$ mkdir /tmp/vhd-mount
$ vhdimount 20201008T074128Z.vhd /tmp/vhd-mount
$ ls /tmp/vhd-mount
vhdi1
vhdi2
```

> Each device (`vhdi1`, …) corresponds to a version of the disks in the used chain, ie one device per differencing VHDs plus one for the dynamic VHD.

When device no longer necessary:

```console
$ fusermount -uz /tmp/vhd-mount
$ rmdir /tmp/vhd-mount
```

## List available partitions

Partitionned disk:

```console
$ partx --bytes --output=NR,START,SIZE,NAME,UUID,TYPE --pairs /tmp/vhd-mount/vhdi2
NR="1" START="2048" SIZE="254803968" NAME="" UUID="c8d70417-01" TYPE="0x83"
NR="2" START="501758" SIZE="8331985920" NAME="" UUID="c8d70417-02" TYPE="0x5"
NR="5" START="501760" SIZE="8331984896" NAME="" UUID="c8d70417-05" TYPE="0x8e"
$ echo $?
0
```

Non-partionned disk:

```console
$ partx --bytes --output=NR,START,SIZE,NAME,UUID,TYPE --pairs /tmp/vhd-mount/vhdi2
partx: /tmp/vhd-mount/vhdi2: failed to read partition table
$ echo $?
1
```

## Mount LVM physical volume (partition type equals to `0x8e`)

> Tip: `offset` and `sizelimit` are only required on a partionned disk

```console
$ losetup -o $(($START * 512)) --sizelimit $(($SIZE)) --show -f /tmp/vhd-mount/vhdi2
/dev/loop0
$ pvscan --cache /dev/loop0
```

When logical volumes no longer necessary:

```console
$ pvs --noheading --nosuffix --nameprefixes --unbuffered --units b -o vg_name /dev/loop0
  LVM2_VG_NAME='debian-vg'
$ vgchange -an debian-vg
$ losetup -d /dev/loop0
```

## List available LVM logical volumes

```console
$ pvs --noheading --nosuffix --nameprefixes --unbuffered --units b -o lv_name,lv_path,lv_size,vg_name /dev/loop0
  LVM2_LV_NAME='root' LVM2_LV_PATH='/dev/debian-vg/root' LVM2_LV_SIZE='7935623168' LVM2_VG_NAME='debian-vg'
  LVM2_LV_NAME='swap_1' LVM2_LV_PATH='/dev/debian-vg/swap_1' LVM2_LV_SIZE='394264576' LVM2_VG_NAME='debian-vg'
```

## Mount LVM logical volume

```console
$ vgchange -ay debian-vg
$ lvs  --noheading --nosuffix --nameprefixes --unbuffered --units b -o lv_name,lv_path
  LVM2_LV_NAME='root' LVM2_LV_PATH='/dev/debian-vg/root'
  LVM2_LV_NAME='swap_1' LVM2_LV_PATH='/dev/debian-vg/swap_1'
```

When logical volume no longer necessary:

```sh
vgchange -an debian-vg
```

## Mount block device

> Tip: `offset` and `sizelimit` are only required on a partionned disk

```console
$ mkdir /tmp/block-mount
$ mount --options=loop,ro,norecovery,offset=$(($START * 512)),sizelimit=$(($SIZE)) --source=/tmp/vhd-mount/vhdi2 --target=/tmp/block-mount
$ ls /tmp/block-mount
bin  boot  dev	etc  home  lib	lib64  lost+found  media  mnt  opt  proc  root	run  sbin  srv	sys  @System.solv  tmp	usr  var
```

When mountpoint no longer necessary:

```sh
umount --lazy /tmp/block-mount
rmdir /tmp/block-mount
```
