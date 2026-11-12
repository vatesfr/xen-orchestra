#!/bin/sh
# Sanity checks on a built ISO: boot timeouts, boot menu background and presence of the repair tool.
# Usage: scripts/check-iso.sh path/to/image.iso
set -eu

iso="$1"
fail() { echo "check-iso: $*" >&2; exit 1; }
[ -s "$iso" ] || fail "$iso is missing or empty (did lb build fail?)"

# next to the ISO rather than in /tmp: the squashfs is several hundred MB and
# /tmp is often a small tmpfs in CI containers
work="$(mktemp -d "$(dirname "$iso")/check-iso.XXXXXX")"
# extracted files are read-only
trap 'chmod -R u+w "$work" 2>/dev/null; rm -rf "$work"' EXIT

if ! xorriso -osirrox on -indev "$iso" \
	-extract /boot/grub "$work/grub" \
	-extract /isolinux "$work/isolinux" \
	-extract /live/filesystem.squashfs "$work/fs.squashfs" > "$work/xorriso.log" 2>&1; then
	grep -v 'UPDATE' "$work/xorriso.log" | tail -n 20 >&2
	df -h "$work" >&2
	fail "cannot extract boot files from $iso"
fi

# grub (UEFI): at least one timeout, none longer than 1 s
grep -rhoE 'set[[:space:]]+timeout=[0-9]+' "$work/grub" > "$work/grub.timeouts" \
	|| fail "no timeout found in the grub configuration"
if grep -vqE 'timeout=(0|1)$' "$work/grub.timeouts"; then
	fail "grub timeout too long: $(sort -u "$work/grub.timeouts" | tr '\n' ' ')"
fi

# syslinux (BIOS): "timeout 0" waits forever
grep -rhioE '^[[:space:]]*timeout[[:space:]]+[0-9]+' "$work/isolinux" > "$work/isolinux.timeouts" \
	|| fail "no timeout found in the isolinux configuration"
if grep -qiE 'timeout[[:space:]]+0$' "$work/isolinux.timeouts"; then
	fail "isolinux waits forever (timeout 0)"
fi

# boot menu background: ours, at the size each boot loader expects (PNG width and
# height are the big-endian 32-bit integers at offset 16 of the IHDR chunk)
png_size() { od -An -tu1 -j16 -N8 "$1" | awk '{ print $1*16777216+$2*65536+$3*256+$4 "x" $5*16777216+$6*65536+$7*256+$8 }'; }
for splash in isolinux/splash.png:640x480 grub/splash.png:800x600; do
	file="$work/${splash%%:*}"
	[ -s "$file" ] || fail "missing boot menu background: ${splash%%:*}"
	size="$(png_size "$file")"
	[ "$size" = "${splash#*:}" ] || fail "${splash%%:*} is $size, ${splash#*:} expected"
done
grep -q '^title-text: ""$' "$work/grub/live-theme/theme.txt" \
	|| fail "the grub menu title is drawn over the boot menu background"
! grep -q '^menu title Boot menu' "$work/isolinux/menu.cfg" \
	|| fail "the isolinux menu title is drawn over the boot menu background"

# the repair tool and its runtime are in the live system
listing="$work/fs.list"
unsquashfs -l "$work/fs.squashfs" > "$listing"
for path in \
	usr/local/bin/xo-repair \
	usr/lib/xo-repair/VERSION \
	usr/lib/xo-repair/xo_repair/__main__.py \
	usr/lib/xo-repair/xo_repair/assets/windows/firstboot.ps1 \
	etc/systemd/system/multi-user.target.wants/xo-repair.service; do
	grep -q "/$path\$" "$listing" || fail "missing in the live system: /$path"
done
for tool in python3 xenstore-read xenstore-write xenstore-rm ntfs-3g; do
	grep -qE "/(usr/)?s?bin/$tool\$" "$listing" || fail "missing tool in the live system: $tool"
done

echo "check-iso: $iso OK"
