#!/bin/bash
# This can be 90% automated

# Install build dependencies (handles Debian/Ubuntu/RHEL variants)
if command -v apt-get >/dev/null; then
    sudo apt-get install -y dh-autoreconf libtool pkg-config git gcc make
elif command -v yum >/dev/null; then
    sudo yum install -y autoreconf libtool pkg-config git gcc make
fi

# Clone and compile nbdkit (platform-agnostic)
git clone https://gitlab.com/nbdkit/nbdkit.git
cd nbdkit
autoreconf -i
./configure
make

# Install plugin to standard location
sudo mkdir -p /usr/lib/x86_64-linux-gnu/nbdkit/plugins
sudo cp ./plugins/vddk/.libs/nbdkit-vddk-plugin.so /usr/lib/x86_64-linux-gnu/nbdkit/plugins/
