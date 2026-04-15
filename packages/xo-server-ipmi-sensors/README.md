<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# xo-server-ipmi-sensors

> XO Server plugin exposing and configuring IPMI sensors

## Usage

Provides access to IPMI (Intelligent Platform Management Interface) sensor data from XenServer/XCP-ng hosts.

Like all other xo-server plugins, it can be configured directly via
the web interface.

This plugin provides an API method (`ipmi-sensors.get_ipmi_sensors`) that retrieves and categorizes IPMI sensor data from supported hosts. Sensor data is automatically categorized by type (temperature, fan speed, power consumption, etc.) using configurable regex patterns for different server vendors.

**Features:**

- Automatic detection of supported server vendors (Dell, Lenovo, etc.)
- Configurable regex patterns for sensor categorization
- Support for multiple sensor data types: temperature, fan speed, power consumption, voltage, status indicators
- Custom computed sensors based on raw IPMI data
- Integration with XO's host management system
- Filtering of relevant sensors based on vendor-specific rules

**Supported sensor data types:**

- Total power consumption
- Inlet/outlet temperatures
- CPU temperatures
- Fan status and speed
- PSU (Power Supply Unit) status and power
- BMC (Baseboard Management Controller) status
- IP address information

## Configuration

The plugin supports configuration of vendor-specific regex patterns for sensor matching. Default configurations are provided for common server vendors including Dell, Lenovo, and others.

Configuration can be customized through the XO web interface to:

- Add support for new server vendors
- Modify sensor categorization rules
- Adjust regex patterns for specific hardware models

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

[AGPL-3.0-or-later](https://spdx.org/licenses/AGPL-3.0-or-later) © [Vates SAS](https://vates.fr)
