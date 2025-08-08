#!/bin/bash
# libnbd installer script - v1.1

VERSION="1.1"
SCRIPT_NAME=$(basename "$0")
MINIMUM_VERSION="1.23.4"
REPO_URL="https://gitlab.com/nbdkit/libnbd.git"
TARGET_VERSION="v1.23.4"

# Check if running as root
check_root() {
    if [ "$(id -u)" -ne 0 ]; then
        echo "[ERROR] This script must be run as root for installation"
        exit 1
    fi
}

# Display usage information
usage() {
    cat <<EOF
Usage: $SCRIPT_NAME [OPTION]

Options:
  --install         Install libnbd from source (requires root)
  --autoremove      Remove existing installation before installing
  -h, --help        Display this help message and exit
  -v, --version     Display script version information

Without options, performs version check only.
Minimum required version: $MINIMUM_VERSION
EOF
}

# Compare version numbers
version_compare() {
    local version=$1 min_version=$2
    if [ "$(printf '%s\n' "$min_version" "$version" | sort -V | head -n1)" = "$min_version" ]; then
        return 0  # version >= min_version
    else
        return 1  # version < min_version
    fi
}

# Check existing installation
check_installation() {
    if command -v nbdinfo >/dev/null; then
        echo "[INFO] libnbd tools are installed."
        local version=$(nbdinfo --version | head -n1 | awk '{print $2}')
        echo "[INFO] Installed version: $version"
        
        if version_compare "$version" "$MINIMUM_VERSION"; then
            echo "[SUCCESS] Version meets requirements."
            return 0
        else
            echo "[WARNING] Installed version is too old (needs $MINIMUM_VERSION or newer)"
            return 1
        fi
    else
        echo "[INFO] libnbd tools are not installed."
        return 2
    fi
}

# Install build dependencies
install_dependencies() {
    echo "[INFO] Installing build dependencies..."
    
    if command -v apt-get >/dev/null; then
        # Debian/Ubuntu
        apt-get install -y \
            dh-autoreconf libtool pkg-config git gcc make \
            ocaml-nox libxml2-dev libssl-dev
    elif command -v yum >/dev/null; then
        # RHEL/CentOS 7
        yum install -y \
            autoreconf libtool pkg-config git gcc make \
            ocaml ocaml-findlib libxml2-devel openssl-devel
    elif command -v dnf >/dev/null; then
        # Fedora/RHEL 8+
        dnf install -y \
            autoreconf libtool pkg-config git gcc make \
            ocaml ocaml-findlib libxml2-devel openssl-devel
    elif command -v zypper >/dev/null; then
        # OpenSUSE
        zypper install -y \
            autoreconf libtool pkg-config git gcc make \
            ocaml ocaml-findlib libxml2-devel libopenssl-devel
    else
        echo "[ERROR] Package manager not supported"
        exit 1
    fi
    
    # Verify OCaml installation
    if ! command -v ocamlc >/dev/null; then
        echo "[ERROR] OCaml compiler not installed correctly"
        exit 1
    fi
}

# Uninstall existing version
uninstall_libnbd() {
    echo "[INFO] Removing existing installation..."
    if command -v apt-get >/dev/null; then
        # Debian/Ubuntu
        apt-get remove -y --purge libnbd*  || true
        apt-get autoremove -y || true
    elif command -v yum >/dev/null; then
        # RHEL/CentOS 7
        yum remove -y libnbd*  || true
    elif command -v dnf >/dev/null; then
        # Fedora/RHEL 8+
        dnf remove -y libnbd* || true
    else
        echo "[WARNING] Could not determine package manager for clean uninstall"
        echo "[INFO] Attempting manual uninstall..."
        # Fallback to manual uninstall
        rm -f /usr/local/bin/nbdinfo \
              /usr/local/bin/nbdcopy \
              /usr/local/bin/nbdublk \
              /usr/local/bin/nbdsh
    fi
    
    echo "[INFO] libnbd tools removed."
}

# Install from source
install_from_source() {
    check_root  # Verify root permissions
    
    echo "[INFO] Installing libnbd version $TARGET_VERSION..."
    
    # Clone or update repository
    if [ -d "libnbd" ]; then
        echo "[INFO] Updating existing repository..."
        cd libnbd || exit 1
        git fetch --all --tags
        git clean -fd
        git reset --hard
    else
        echo "[INFO] Cloning repository..."
        git clone "$REPO_URL"
        cd libnbd || exit 1
    fi
    
    # Checkout specific version
    echo "[INFO] Checking out $TARGET_VERSION..."
    git checkout "$TARGET_VERSION" || {
        echo "[ERROR] Failed to checkout $TARGET_VERSION"
        exit 1
    }
    
    # Configure and build
    echo "[INFO] Configuring..."
    autoreconf -i
    ./configure
    
    echo "[INFO] Compiling..."
    make -j$(nproc)
    
    echo "[INFO] Installing..."
    make install
    
    # Update linker cache
    ldconfig
    
    # Verify installation
    if command -v nbdinfo >/dev/null; then
        local version=$(nbdinfo --version | head -n1 | awk '{print $2}')
        echo "[SUCCESS] Installed version: $version"
    else
        echo "[ERROR] Installation failed"
        exit 1
    fi
}

# Main script execution
AUTO_REMOVE=false
AUTO_INSTALL=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --install)
            AUTO_INSTALL=true
            shift
            ;;
        --autoremove)
            AUTO_REMOVE=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        -v|--version)
            echo "$SCRIPT_NAME version $VERSION"
            exit 0
            ;;
        *)
            echo "Error: Unknown option $1"
            usage
            exit 1
            ;;
    esac
done

# Check existing installation
check_installation
status=$?

if [ $status -eq 0 ]; then
    echo "[INFO] System meets requirements."
    exit 0
elif [ $AUTO_INSTALL = true ]; then
    if [ $AUTO_REMOVE = true ] && [ $status -ne 2 ]; then
        uninstall_libnbd
    fi
    install_dependencies
    install_from_source
elif [ $status -eq 1 ]; then
    echo "--------------------------------------------------"
    echo " Installed libnbd version is too old."
    echo " Would you like to:"
    echo " 1) Install version $TARGET_VERSION from source (requires root)"
    echo " 2) Keep the current installation"
    echo " 3) Exit"
    echo "--------------------------------------------------"
    read -p "Enter your choice [1-3]: " choice
    
    case $choice in
        1)
            echo "[INFO] Proceeding with installation..."
            uninstall_libnbd
            install_dependencies
            install_from_source
            ;;
        2)
            echo "[INFO] Keeping current installation."
            exit 0
            ;;
        *)
            echo "[INFO] Exiting."
            exit 0
            ;;
    esac
else
    # libnbd not installed at all
    if [ $AUTO_INSTALL = true ]; then
        install_dependencies
        install_from_source
    else
        echo "--------------------------------------------------"
        echo " libnbd is not installed."
        echo " Would you like to install version $TARGET_VERSION?"
        echo " 1) Install from source (requires root)"
        echo " 2) Exit"
        echo "--------------------------------------------------"
        read -p "Enter your choice [1-2]: " choice
        
        case $choice in
            1)
                install_dependencies
                install_from_source
                ;;
            *)
                echo "[INFO] Exiting."
                exit 0
                ;;
        esac
    fi
fi