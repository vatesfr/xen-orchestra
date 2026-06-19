# Categorizing "unknown" IPMI sensors

When the plugin returns a sensor tagged with `"dataType": "unknown"`, it means
the sensor name matched **none** of the regex rules configured for that host's
vendor. Unknown sensors are still listed by the discovery endpoint, but they are
**dropped** from `get_ipmi_sensors` (the categorized output consumed by the UI),
because the plugin only keeps sensors it knows how to classify.

This guide explains how to map those unknown sensors to a known data type.

## 1. Understand the pipeline

- `get_ipmi_sensors` ([index.mts](../src/index.mts)) returns sensors **grouped
  by data type**, after filtering out everything irrelevant/unknown. This is
  what the UI shows.
- `getAvailableIpmiSensors` ([index.mts](../src/index.mts)) returns **every raw
  sensor** with its resolved `dataType` (or `"unknown"`). Use this to discover
  what needs a rule.

Both resolve the vendor from the host BIOS strings (`system-product-name`,
lowercased). Note that all Dell hosts are collapsed to the vendor `dell` and all
Lenovo hosts to `lenovo`, regardless of model.

## 2. Get the list of sensors to categorize

Fetch the available sensors for the host (e.g. via the REST route or
`getAvailableIpmiSensors`). You'll get output like:

```json
{
  "productName": "dell",
  "systemManufacturer": "dell inc.",
  "ipmiDeviceAvailable": true,
  "sensors": [
    { "name": "Inlet Temp", "value": "22 degrees C", "event": "ok", "dataType": "inletTemp" },
    { "name": "Pwr Consumption", "value": "140 Watts", "event": "ok", "dataType": "totalPower" },
    { "name": "Current 1", "value": "0.60 Amps", "event": "ok", "dataType": "unknown" },
    { "name": "Current 2", "value": "0 Amps", "event": "ok", "dataType": "unknown" }
  ]
}
```

Pick out the `unknown` sensors that carry data you actually want to surface.
Most `0x00` / `Not Readable` status flags are noise and can stay unknown — only
promote sensors that map to a real metric. In the example above, `Current 1` /
`Current 2` (PSU amperage) are good candidates; the dozens of `PG` / `Presence`
flags are not.

## 3. Pick the target data type

A rule maps a sensor **name** to one of these data types
([types.mts](../src/types.mts), `IPMI_SENSOR_DATA_TYPE`):

| Data type    | Meaning                         |
| ------------ | ------------------------------- |
| `totalPower` | Total power consumption (Watts) |
| `inletTemp`  | Inlet / ambient temperature     |
| `outletTemp` | Outlet / exhaust temperature    |
| `cpuTemp`    | CPU temperature                 |
| `fanSpeed`   | Fan speed (RPM)                 |
| `fanStatus`  | Fan status                      |
| `psuPower`   | PSU power / voltage             |
| `psuStatus`  | PSU status                      |
| `bmcStatus`  | BMC status                      |
| `ip`         | Management IP address           |

## 4. Write the regex

Each rule is a `/pattern/flags` string keyed by data type, grouped under a
vendor. Patterns are matched against the sensor **name**. Anchor with `^…$` and
use the `i` flag so casing doesn't matter:

```json
{
  "vendors": [
    {
      "vendor": "dell",
      "sensorRegexps": {
        "fanSpeed": "/^fan[0-9]+(a|b)$/i",
        "psuPower": "/^voltage [0-9]+$/i",
        "psuStatus": "/^ps[0-9]+ pg fail$/i",
        "cpuTemp": "/^temp$/i",
        "totalPower": "/^pwr consumption$/i",
        "inletTemp": "/^inlet temp$/i",
        "outletTemp": "/^exhaust temp$/i",
        "ip": "/^ip address$/i"
      }
    }
  ]
}
```

> **Tip:** when several sensors share the same name (e.g. `Voltage 1` / `Voltage 2`), the plugin automatically
> groups them into an array under that data type. Write one pattern that matches
> all of them rather than one rule per sensor.

## 5. Apply the configuration

- **Per deployment:** edit the plugin configuration in the XO web interface
  (Settings → Plugins → ipmi-sensors → `vendors`). This overrides the defaults
  without touching the code.
- **As a new default preset:** add/extend the vendor entry in
  `DEFAULT_IPMI_SENSOR_REGEX_BY_DATA_TYPE_BY_SUPPORTED_PRODUCT_NAME` in
  [default-rules.mts](../src/default-rules.mts). These ship as the built-in
  defaults for everyone.

To support a brand-new vendor, add a new `{ vendor, sensorRegexps }` object. The
`vendor` must equal the lowercased `system-product-name` of the host (or `dell`
/ `lenovo`, which are normalized in [index.mts](../src/index.mts)).

## 6. Verify

Re-run `getAvailableIpmiSensors` and confirm the previously-unknown sensors now
report the expected `dataType`, then check that `get_ipmi_sensors` groups them
correctly.
