# Alerts

Alerts are a way to warn the administrator about various events. The first kind of alerts will be emails and also in a dedicated area of `xo-web` to display them.

## Performances alerts

The administrator will configure alerts based on performance thresholds.

The configurable metrics are:

- CPU usage (VM, host)
- RAM usage (VM, host)
- network bandwidth (VM, host)
- load average (host)
- disk IO (VM)
- total IO (SR, only for XenServer Dundee and higher)

If any configured values exceed the threshold during a selected period of time, an alert will be sent.

Those alerts will be also stored and accessible in the web interface, and also later for the load balancing feature (helping it to solve those performance problems).

## Updates alerts

When your XOA detects new packages, you'll be notified by email.

## Backup alerts

Same story for backups: if a backup fails, you'll receive an email.

You can choose to be notified only if it fails or even after each backup job.

Current supported alerts system:

- Email
- XMPP
