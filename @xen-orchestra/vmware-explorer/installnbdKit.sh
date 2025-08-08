#!/bin/bash
# Automated nbdkit installation with VDDK plugin support

VERSION="1.1"
SCRIPT_NAME=$(basename "$0")
MINIMUM_VERSION="1.44.0"

# Display usage information
usage() {
    cat <<EOF
Usage: $SCRIPT_NAME [OPTION]

Options:
  --install         Automatically install nbdkit from source with VDDK plugin
  --autoremove      Remove existing nbdkit installation before installing from source
  -h, --help        Display this help message and exit
  -v, --version     Display version information and exit

With no options, performs only version and plugin checks.
Minimum required nbdkit version: $MINIMUM_VERSION
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

# Function to check if nbdkit is installed and has VDDK plugin
check_nbdkit() {
    if command -v nbdkit >/dev/null; then
        echo "[INFO] nbdkit is installed."
        local version=$(nbdkit --version | head -n1 | awk '{print $2}')
        echo "[INFO] Installed version: $version"
        
        # Version check
        if ! version_compare "$version" "$MINIMUM_VERSION"; then
            echo "[WARNING] Installed version $version is older than minimum required $MINIMUM_VERSION"
            return 3
        fi
        
        # Check if VDDK plugin exists
        if nbdkit --dump-plugin vddk 2>/dev/null | grep -q "vddk"; then
            echo "[SUCCESS] VDDK plugin is already installed."
            return 0
        else
            echo "[WARNING] nbdkit is installed but VDDK plugin is missing."
            return 1
        fi
    else
        echo "[INFO] nbdkit is not installed."
        return 2
    fi
}

# Function to uninstall existing nbdkit
uninstall_nbdkit() {
    echo "[INFO] Removing existing nbdkit installation..."
    if command -v apt-get >/dev/null; then
        sudo apt-get remove -y --purge nbdkit
        sudo apt-get autoremove -y
    elif command -v yum >/dev/null; then
        sudo yum remove -y nbdkit
    elif command -v dnf >/dev/null; then
        sudo dnf remove -y nbdkit
    fi
    echo "[INFO] nbdkit has been removed."
}

# Function to install nbdkit from source with VDDK plugin
install_from_source() {
    echo "[INFO] Installing nbdkit from source (minimum version $MINIMUM_VERSION)..."
    
    # Install build dependencies
    echo "[INFO] Installing build dependencies..."
    if command -v apt-get >/dev/null; then
        sudo apt-get install -y dh-autoreconf libtool pkg-config git gcc make
    elif command -v yum >/dev/null; then
        sudo yum install -y autoreconf libtool pkg-config git gcc make
    fi
    
    # Clone or update repository
    if [ -d "nbdkit" ]; then
        echo "[INFO] Updating existing nbdkit repository..."
        cd nbdkit || exit 1
        git pull origin master
    else
        echo "[INFO] Cloning nbdkit repository..."
        git clone https://gitlab.com/nbdkit/nbdkit.git
        cd nbdkit || exit 1
    fi
    
    # Verify we have at least the minimum version
    local git_version=$(git describe --tags | sed 's/^v//;s/-.*//')
    if ! version_compare "$git_version" "$MINIMUM_VERSION"; then
        echo "[ERROR] Repository version $git_version is older than required $MINIMUM_VERSION"
        echo "[INFO] Trying to checkout tag v$MINIMUM_VERSION..."
        git checkout "v$MINIMUM_VERSION" || {
            echo "[ERROR] Failed to checkout version $MINIMUM_VERSION"
            exit 1
        }
    fi
    
    # Compile and install
    echo "[INFO] Compiling nbdkit..."
    autoreconf -i
    ./configure
    make
    
    # Install
    echo "[INFO] Installing nbdkit and plugins..."
    sudo make install
    
    # Verify VDDK plugin installation
    if nbdkit --dump-plugin vddk 2>/dev/null | grep -q "vddk"; then
        echo "[SUCCESS] nbdkit with VDDK plugin installed successfully."
        echo "[INFO] Installed version: $(nbdkit --version | head -n1)"
    else
        echo "[ERROR] VDDK plugin installation failed."
        exit 1
    fi
}

# Parse command line arguments
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

# Main execution
check_nbdkit
status=$?

if [ $status -eq 0 ]; then
    echo "[INFO] System meets requirements."
    exit 0
elif [ $AUTO_INSTALL = true ]; then
    if [ $AUTO_REMOVE = true ] && [ $status -ne 2 ]; then
        uninstall_nbdkit
    fi
    install_from_source
elif [ $status -eq 1 ] || [ $status -eq 3 ]; then
    echo "--------------------------------------------------"
    echo " nbdkit installation problem detected:"
    [ $status -eq 1 ] && echo " - Missing VDDK plugin"
    [ $status -eq 3 ] && echo " - Version older than $MINIMUM_VERSION"
    echo ""
    echo " Would you like to:"
    echo " 1) Reinstall nbdkit from source (with VDDK support)"
    echo " 2) Keep the current installation"
    echo " 3) Exit"
    echo "--------------------------------------------------"
    read -p "Enter your choice [1-3]: " choice
    
    case $choice in
        1)
            echo "[INFO] Proceeding with reinstallation..."
            uninstall_nbdkit
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
    # nbdkit not installed at all
    if [ $AUTO_INSTALL = true ]; then
        install_from_source
    else
        echo "--------------------------------------------------"
        echo " nbdkit is not installed."
        echo " Would you like to install it from source?"
        echo " 1) Install nbdkit from source (with VDDK support)"
        echo " 2) Exit"
        echo "--------------------------------------------------"
        read -p "Enter your choice [1-2]: " choice
        
        case $choice in
            1)
                install_from_source
                ;;
            *)
                echo "[INFO] Exiting."
                exit 0
                ;;
        esac
    fi
fi