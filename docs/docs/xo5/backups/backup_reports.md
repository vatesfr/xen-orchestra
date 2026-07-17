# Backup reports

At the end of a backup job, you can configure Xen Orchestra to send backup reports directly by email, Slack or in Mattermost. It's up to you.

## Email

### Step-by-step

1. In the **Settings → Plugins** view, enable and configure the **Backup-reports** plugin.
   ![](../../assets/backup-reports-plugin.png)

2. Configure also the `transport-email` plugin (see detailed configuration below).
   ![](../../assets/transport-email-plugin.png)

3. Once it's done, you can now create your backup job. In the "report" selection you can choose the situation in wish you want to receive an email (always, never or failure).
   ![](../../assets/backup-report-config.png)

:::tip
You can also modify existing backup jobs and change the behaviour of the report system.
:::

### Email Provider Configuration

:::info
**Authentication Requirements**

- **Gmail**: Standard passwords no longer work - App Passwords with 2FA are required
- **Microsoft 365**: Basic authentication still works but will be disabled in March 2026

:::

#### Gmail Configuration

Gmail users must use App Passwords for SMTP authentication.

**Prerequisites:**

- Enable 2-Factor Authentication on your Google account.

**Steps:**

1. **Enable 2FA**: Go to [Google Account Security](https://myaccount.google.com/security) → 2-Step Verification
2. **Generate App Password**: Visit [App Passwords](https://myaccount.google.com/apppasswords) → Select "Mail" → Generate
3. **Configure transport-email plugin:**
   - Host: `smtp.gmail.com`
   - Port: `587`
   - Secure: `Auto` or `STARTTLS`
   - Username: Your Gmail address
   - Password: The 16-character App Password (no spaces)

:::tip
App Passwords are more secure than regular passwords, as they require 2FA and can be revoked individually.
:::

#### Microsoft 365 Configuration

**Current Configuration :**

- Host: `smtp.office365.com`
- Port: `587`
- Secure: `STARTTLS`
- Username: Your Office 365 email
- Password: Your Office 365 password

:::warning
Microsoft will permanently disable basic authentication between March 1 and April 30, 2026. After this date, your email notifications will stop working
:::

#### Other SMTP Providers

For providers supporting basic authentication:

- Host: Your SMTP server
- Port: `587` (STARTTLS) or `465` (TLS)
- Username/Password: As provided by your service

### Network Requirements

The transport-email plugin requires outbound access to:

- Port 587 (SMTP with STARTTLS)
- Port 465 (SMTP over TLS)
- SMTP server addresses (e.g., smtp.gmail.com)

### Troubleshooting

**Gmail "Authentication failed":**

- Ensure you're using an App Password, not your regular password.
- Verify 2FA is enabled

**Microsoft 365 "Authentication unsuccessful":**

- Check if your organization has disabled SMTP AUTH
- Contact your IT administrator

**Connection timeouts:**

- Verify firewall allows outbound SMTP
- Test connectivity: `telnet [smtp-server] 587`

## XMPP

You can **be notified via XMPP** after the backup task is finished (scheduled "full backup", "snapshots" or "disaster recovery").

To configure it, 2 steps are needed in the plugin section (under "Settings"):

1. add a list of recipient(s) for the notifications (in the plugin "backup-reports" and for XMPP)
2. set the XMPP server

That's it: your next scheduled job will be recapped in a message:

![](https://xen-orchestra.com/blog/content/images/2015/12/xmpp.png)

## Slack or Mattermost

Xen Orchestra is able to send backup reports to Slack or Mattermost.

### Plugin configuration

Like all other xo-server plugins, it can be configured directly via the web interface, see [the plugin documentation](../xen-orchestra/architecture#plugins).

### Generate the Webhook

#### Slack

1. Log in your Slack team account

2. Click on the **Main menu** at the top and choose **Apps & Integrations**

![Apps & Integrations](../../assets/DocImg1.png)

3. Search **Incoming WebHooks**

![Incoming WebHooks](../../assets/DocImg2.png)

4. Click on **Add Configuration**

![Add Configuration](../../assets/DocImg3.png)

5. Choose the default channel and click on **Add Incoming WebHooks integration**

![Add Incoming WebHooks integration](../../assets/DocImg4.png)

6. Modify the default settings and click on **Save Settings**

![Save Settings](../../assets/DocImg5.png)

#### Mattermost

You need to be an admin:

- Go into the MatterMost menu, then Integration
- Click on "Add Incoming webhook"
- "Add Incoming Webhook"

### Testing the plugin

#### Slack

![Slack configuration](../../assets/DocImg6.png)

![Slack](../../assets/DocImg7.png)

#### Mattermost

![Mattermost configuration](../../assets/DocImg8.png)

![Mattermost](../../assets/DocImg9.png)

## Nagios

The `transport-nagios` plugin allows you to integrate Xen Orchestra backup reports directly into your Nagios monitoring system.

Instead of relying solely on email notifications, this plugin sends the status of your backup jobs as **passive checks** to Nagios. This ensures that your infrastructure monitoring dashboard remains the single source of truth for your backup health.

![Preview of the Nagios interface](../../assets/nagios-preview.jpg)

### Overview

When a backup job completes, Xen Orchestra sends a report. By using the plugin, the result (`Success`, `Warning`, or `Error`) is pushed to the Nagios command file.

* **Success**: Sends an `OK` status.
* **Warning**: Sends a `WARNING` status.
* **Error/Partial Success**: Sends a `CRITICAL` status.

### Prerequisites

#### NSCA

In order to contact Nagios, you must have NSCA (Nagios Service Check Acceptor) running on this Nagios host. 

:::note
NSCA is a Linux/Unix daemon that lets remote systems "push" status updates to a Nagios server as passive checks. It basically acts as a bridge, by sending data from a client to a server-side daemon that feeds the results directly into Nagios's command file.
:::

The architecture is like this:

![NSCA schema](../../assets/nsca.png)

Check your config file and add a password and a least XOR encryption:

```
password=mypassword
decryption_method=1
```

#### Nagios configuration

#### 1. Create a host for XOA

```
define host{
        use                     generic-host            ; Name of $
        host_name               xoa
        alias                   Xen Orchestra Appliance
        address                 192.168.0.245
        }
```

#### 2. Create a dedicated service for XOA backups

```
define service{
        name                            passif-generic
        use                             generic-service
        service_description             xoabackups
        host_name                       xoa
        active_checks_enabled           0
        passive_checks_enabled          1
        is_volatile                     1
        max_check_attempts              1
        check_freshness                 1
        freshness_threshold             86400
        check_command                   no-backup-report!0!No backup message sent in the last 24 hours
}
```

This service will wait for XOA to send backup news in the last 24 hours.

Your Nagios setup is now ready. If the service doesn't have news from XOA, it will be in `CRITICAL` state, like this:

![Critical alert in Nagios](../../assets/xo5nagiosset.png)

### Installation in XOA

The plugin is part of the standard Xen Orchestra transport packages. 

1. Go to **Settings → Plugins**.
2. Locate `transport-nagios`.
3. Toggle the switch to **Enabled**.

### Configuration

Once the plugin is enabled, you need to configure the connection to your Nagios server. 

1. Click the edit icon (+) for the `transport-nagios` plugin to show the configuration form:

![transport-nagios plugin configuration form](../../assets/nagios-plugin-configuration.png)

2. Enter your desired values.
3. Click **Save configuration** to save and apply your changes.

### Test the plugin

In the transport-nagios configuration form, you can test the plugin.

If the plugin works correctly, the result should look like this:

![Test for the transport-nagios plugin. The plugin is shown as working fine](../../assets/transport-nagios-test.png)

If your backup was completed successfully, the result should look like this:

![Test for the transport-nagios plugin, showing a successful backup](../../assets/transport-nagios-backup-successful.png)

### Further resources

- [Nagios website](https://www.nagios.org/)
- [Official Nagios documentation](https://www.nagios.org/documentation/)

## Web hooks

You can also configure web hooks to be sent to a custom server before and/or after a backup job runs. This won't send a formatted report but raw JSON data that you can use in custom scripts on your side. Follow the [web-hooks plugin documentation](../management/advanced#web-hooks) to configure it.
