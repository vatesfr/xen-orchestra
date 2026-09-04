# Backup reports

At the end of a backup job, Xen Orchestra can send you a report through the channel of your choice: email, XMPP, Slack or Mattermost, and even straight into your Nagios or Icinga 2 monitoring.

Whatever the channel, the logic is always the same, in three steps:

1. Enable and configure the **backup-reports** plugin, which builds the report and lists the recipients.
2. Enable and configure the **transport** plugin matching your channel (`transport-email`, `transport-xmpp`, `transport-slack`, `transport-nagios` or `transport-icinga2`).
3. In the backup job itself, pick a **report condition**: **Always**, **Skipped and failure**, **Failure** (errors only) or **Never**.

## Email

### Step-by-step

1. In the **Settings → Plugins** view, enable and configure the **backup-reports** plugin. This is where you add the list of email recipients. You can also set a custom subject suffix, appended to the subject of every backup report email.

<UiDetail src="/img/xo5/backup-reports-plugin.png" alt="The backup-reports plugin in Settings, Plugins, with its list of email recipients" width={700} />

2. Enable and configure the `transport-email` plugin: sender name and address, then the SMTP transport itself (host, port, security mode, user and password). See the provider walkthroughs below for concrete values.

<UiDetail src="/img/xo5/transport-email-plugin.png" alt="The transport-email plugin configuration form with the sender and SMTP transport fields" width={700} />

3. Once done, create your backup job. In the **Report** selector, choose when you want to receive an email: **Always**, **Skipped and failure**, **Failure** (errors only) or **Never**.

<UiDetail src="/img/xo5/backup-report-config.png" alt="The Report selector of a backup job, set to send a report on skipped and failed runs" width={700} />

:::tip
You can also modify existing backup jobs and change the behavior of the report system at any time.
:::

### Email Provider Configuration

:::info
**Authentication requirements**

- **Gmail**: standard passwords no longer work. App Passwords with 2FA are required.
- **Microsoft 365**: basic authentication is now permanently disabled (since spring 2026). Direct SMTP submission with a plain password no longer works, see below.

:::

#### Gmail Configuration

Gmail users must use App Passwords for SMTP authentication.

**Prerequisites:**

- Enable 2-Factor Authentication on your Google account.

**Steps:**

1. **Enable 2FA**: Go to [Google Account Security](https://myaccount.google.com/security) → 2-Step Verification
2. **Generate App Password**: Visit [App Passwords](https://myaccount.google.com/apppasswords) → Select "Mail" → Generate
3. **Configure the transport-email plugin:**
   - Host: `smtp.gmail.com`
   - Port: `587`
   - Secure: `auto (uses STARTTLS if available)` or `force (requires STARTTLS or fail)`
   - User: your Gmail address
   - Password: the 16-character App Password (no spaces)

:::tip
App Passwords are more secure than regular passwords, as they require 2FA and can be revoked individually.
:::

#### Microsoft 365 Configuration

:::warning
Microsoft permanently disabled basic authentication for SMTP submission between March and April 2026. The historical configuration (`smtp.office365.com`, port `587`, your Microsoft 365 email address and password) **no longer works**, and the `transport-email` plugin does not support the OAuth2 flow that Microsoft now requires for direct submission.
:::

If your email notifications went through Microsoft 365 and stopped working, you have several honest ways forward:

- **Use an SMTP relay in front of Microsoft 365**: point `transport-email` at an internal relay (a Postfix or similar MTA) and let that relay deliver to Microsoft 365, for example through an Exchange Online connector restricted to your relay's IP address.
- **Use Microsoft's replacement services**: Azure Communication Services Email and Exchange Online High Volume Email both provide SMTP endpoints with their own credentials, designed for application-generated mail such as these reports.
- **Switch to another SMTP provider**: any provider that still supports user and password authentication works out of the box with the plugin (see below).

#### Other SMTP Providers

For providers supporting basic authentication:

- Host: your SMTP server
- Port: `587` (STARTTLS) or `465` (TLS)
- User/Password: as provided by your service

### Network Requirements

The transport-email plugin requires outbound access to:

- Port 587 (SMTP with STARTTLS)
- Port 465 (SMTP over TLS)
- SMTP server addresses (e.g., smtp.gmail.com)

### Troubleshooting

**Gmail "Authentication failed":**

- Ensure you're using an App Password, not your regular password.
- Verify 2FA is enabled.

**Microsoft 365 "Authentication unsuccessful":**

- Basic authentication is permanently disabled since spring 2026: a direct password-based configuration cannot work anymore. Use one of the alternatives described in the [Microsoft 365 section](#microsoft-365-configuration).

**Connection timeouts:**

- Verify your firewall allows outbound SMTP.
- Test connectivity:

<Terminal shell title="xoa — test SMTP connectivity">{`
telnet smtp-server.example.com 587
`}</Terminal>

## XMPP

You can be notified via XMPP after a backup job run. The flow is the same as for email:

1. In the **backup-reports** plugin, add the list of XMPP recipients (the **xmpp address** field).
2. Enable and configure the `transport-xmpp` plugin: XMPP server host, port (`5222` by default), the user (XMPP address) and password used to authenticate.
3. Choose the report condition in your backup job.

That's it: your next scheduled job will be recapped in a message:

<UiDetail src="/img/xo5/xmpp-report.png" alt="A backup report recap received as an XMPP message" width={620} />

## Slack or Mattermost

Xen Orchestra is able to send backup reports to Slack or Mattermost. Both are handled by the same `transport-slack` plugin, which posts the report to an incoming webhook URL.

### Plugin configuration

Like all other xo-server plugins, it can be configured directly via the web interface, see [the plugin documentation](../architecture.md#plugins). The plugin needs:

- **Webhook URI**: the Mattermost or Slack webhook URL (see below to generate it)
- **Channel**: the channel, private group or IM channel to send the message to
- Optionally, a bot **username** and **icon** (a Slack emoji or an image URL)

Then choose the report condition in your backup job, as for any other transport.

### Generate the Webhook

#### Slack

1. Log in to your Slack team account.

2. Click on the **Main menu** at the top and choose **Apps & Integrations**.

<UiDetail src="/img/xo5/slack-apps-menu.png" alt="The Slack main menu with the Apps and Integrations entry" width={188} />

3. Search for **Incoming WebHooks**.

<UiDetail src="/img/xo5/slack-incoming-webhooks-search.png" alt="The Incoming WebHooks app in the Slack app directory search results" width={620} />

4. Click on **Add Configuration**.

<UiDetail src="/img/xo5/slack-add-configuration.png" alt="The Add Configuration button on the Incoming WebHooks app page" width={264} />

5. Choose the default channel and click on **Add Incoming WebHooks integration**.

<UiDetail src="/img/xo5/slack-add-webhook-integration.png" alt="Channel selection followed by the Add Incoming WebHooks integration button" width={620} />

6. Modify the default settings and click on **Save Settings**.

<UiDetail src="/img/xo5/slack-webhook-settings.png" alt="The webhook integration settings with the generated webhook URL" width={620} />

#### Mattermost

You need to be an admin:

1. Go into the Mattermost menu, then **Integrations**.
2. Click on **Add Incoming webhook**.
3. Copy the generated webhook URL into the plugin configuration.

### Testing the plugin

#### Slack {#slack-1}

Fill the plugin configuration with your webhook URL and channel, then use the test button:

<UiDetail src="/img/xo5/slack-plugin-configuration.png" alt="The transport-slack plugin configuration filled with a Slack webhook URL and channel" width={700} />

<UiDetail src="/img/xo5/slack-report-example.png" alt="The test message posted by the Xen Orchestra bot in a Slack channel" width={620} />

#### Mattermost {#mattermost-1}

The same plugin works for Mattermost, only the webhook URL changes:

<UiDetail src="/img/xo5/mattermost-plugin-configuration.png" alt="The transport-slack plugin configuration filled with a Mattermost webhook URL" width={700} />

<UiDetail src="/img/xo5/mattermost-report-example.png" alt="The test message posted by the Xen Orchestra bot in a Mattermost channel" width={700} />

## Nagios

The `transport-nagios` plugin allows you to integrate Xen Orchestra backup reports directly into your Nagios monitoring system.

Instead of relying solely on email notifications, this plugin sends the status of your backup jobs as **passive checks** to Nagios. This ensures that your infrastructure monitoring dashboard remains the single source of truth for your backup health.

<UiDetail src="/img/xo5/nagios-preview.jpg" alt="A Nagios services view showing backup job results reported by Xen Orchestra" width={620} />

### Overview

When a backup job completes, Xen Orchestra sends a report. By using the plugin, the result (`Success`, `Warning`, or `Error`) is pushed to the Nagios command file.

- **Success**: sends an `OK` status.
- **Warning**: sends a `WARNING` status.
- **Error/Partial Success**: sends a `CRITICAL` status.

By default, the plugin reports each VM under a Nagios **host** named after the VM (`{vm.name_label}`) and a **service** named after the backup job (`{job.name}`). You can customize both patterns in the plugin configuration, as long as the custom values still include the `{vm.name_label}` and `{job.name}` templates respectively.

### Prerequisites

#### NSCA

In order to contact Nagios, you must have NSCA (Nagios Service Check Acceptor) running on the Nagios host.

:::note
NSCA is a Linux/Unix daemon that lets remote systems "push" status updates to a Nagios server as passive checks. It basically acts as a bridge, by sending data from a client to a server-side daemon that feeds the results directly into Nagios's command file.
:::

The architecture is like this:

<UiDetail src="/img/xo5/nsca.png" alt="Schema of Xen Orchestra pushing passive checks to Nagios through the NSCA daemon" width={480} />

Check your NSCA config file and add a password and at least XOR encryption:

<Terminal title="nsca.cfg — password and encryption">{`
password=mypassword
decryption_method=1
`}</Terminal>

#### Nagios configuration

#### 1. Create a host for each backed-up VM {#1-create-a-host-for-xoa}

With the default plugin configuration, the Nagios host name must match the VM name:

<Terminal title="Nagios — host definition">{`
define host{
        use                     generic-host
        host_name               my-vm-name          ; must match the VM name in XO
        alias                   My VM
        address                 192.168.0.245
        }
`}</Terminal>

#### 2. Create a dedicated service for the backup reports {#2-create-a-dedicated-service-for-xoa-backups}

With the default plugin configuration, the service description must match the backup job name:

<Terminal title="Nagios — passive service definition">{`
define service{
        name                            passif-generic
        use                             generic-service
        service_description             my backup job       ; must match the job name in XO
        host_name                       my-vm-name
        active_checks_enabled           0
        passive_checks_enabled          1
        is_volatile                     1
        max_check_attempts              1
        check_freshness                 1
        freshness_threshold             86400
        check_command                   no-backup-report!0!No backup message sent in the last 24 hours
}
`}</Terminal>

This service will wait for Xen Orchestra to send backup news in the last 24 hours.

Your Nagios setup is now ready. If the service doesn't hear from Xen Orchestra in time, it will be in `CRITICAL` state, like this:

<UiDetail src="/img/xo5/xo5nagiosset.png" alt="A Nagios service row in CRITICAL state because no backup report was received in the last 24 hours" width={700} />

### Installation in XOA

The plugin is part of the standard Xen Orchestra transport packages.

1. Go to **Settings → Plugins**.
2. Locate `transport-nagios`.
3. Toggle the switch to **Enabled**.

### Configuration

Once the plugin is enabled, you need to configure the connection to your Nagios server.

1. Click the edit icon (+) for the `transport-nagios` plugin to show the configuration form:

<UiDetail src="/img/xo5/nagios-plugin-configuration.png" alt="The transport-nagios configuration form with the server address, NSCA port, encryption key, and the host and service name patterns" width={620} />

2. Enter the Nagios server address, the NSCA port and the encryption key, and adjust the host and service name patterns if needed.
3. Click **Save configuration** to save and apply your changes.

### Test the plugin

In the transport-nagios configuration form, you can test the plugin.

If the plugin works correctly, the result should look like this:

<UiDetail src="/img/xo5/transport-nagios-test.png" alt="A Nagios service row showing the transport-nagios test message, the plugin works fine" width={700} />

If your backup was completed successfully, the result should look like this:

<UiDetail src="/img/xo5/transport-nagios-backup-successful.png" alt="A Nagios service row in OK state after a successful backup job" width={700} />

### Further resources

- [Nagios website](https://www.nagios.org/)
- [Official Nagios documentation](https://www.nagios.org/documentation/)

## Icinga 2

The `transport-icinga2` plugin does the same job for Icinga 2: it pushes the backup result as a **passive check result** through the Icinga 2 REST API (`/v1/actions/process-check-result`), so no NSCA daemon is needed.

1. In **Settings → Plugins**, enable `transport-icinga2`.
2. Configure it:
   - **Server**: the Icinga 2 HTTP/HTTPS API address (e.g. `https://icinga2.example.com`). If no port is given in the URL, `5665` is used.
   - **User** and **password**: the Icinga 2 API credentials.
   - **Filter**: an [Icinga 2 API filter](https://icinga.com/docs/icinga2/latest/doc/12-icinga2-api/#filters) selecting the service(s) to update, e.g. `host.name=="xoa.example.com" && service.name=="xo-backup"`.
   - Optionally, accept unauthorized (self-signed) certificates.
3. Choose the report condition in your backup job.

Backup results are mapped to the standard Icinga 2 states: `OK` for a success, `WARNING` for a partial success, `CRITICAL` for a failure.

## Web hooks

You can also configure web hooks to be sent to a custom server before and/or after a backup job runs. This won't send a formatted report but raw JSON data that you can use in custom scripts on your side. Follow the [web-hooks plugin documentation](./advanced#web-hooks) to configure it.
