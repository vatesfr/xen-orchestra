# xo-server-transport-slack [![Build Status](https://travis-ci.org/vatesfr/xo-server-transport-slack.png?branch=master)](https://travis-ci.org/vatesfr/xo-server-transport-slack)

> ${pkg.description}

## Install

Installation of the [npm package](https://npmjs.org/package/xo-server-transport-slack):

```
> npm install --global xo-server-transport-slack
```

## Usage

Like all other xo-server plugins, it can be configured directly via
the web iterface, see [the plugin documentation](https://xen-orchestra.com/docs/plugins.html). You can also test the configuration plugin if it works.

### Slack

#### Generate the Webhook

1. Log in your Slack team account
2. Click on the **Main menu** at the top and choose **Apps & Integrations**

   ![Apps & Integrations](image/DocImg1.png)
3. Search **Incoming WebHooks**

   ![Incoming WebHooks](image/DocImg2.png)
4. Click on **Add Configuration**

   ![Add Configuration](image/DocImg3.png)
5. Choose the default channel and click on **Add Incoming WebHooks integration**

   ![Add Incoming WebHooks integration](image/DocImg4.png)
6. Modify the default settings and click on **Save Settings**

   ![Save Settings](image/DocImg5.png)

### Testing the plugin

#### Slack

![Slack configuration](image/DocImg6.png)

![Slack](image/DocImg7.png)

#### Mattermost

![Mattermost configuration](image/DocImg8.png)

![Mattermost](image/DocImg9.png)

## Development

### `Xo#sendSlackMessage({ message }) `

This xo method is called to send the message passed in parameter to Slack or Mattermost.

# Install dependencies
> npm install

# Run the tests
> npm test

# Continuously compile
> npm run dev

# Continuously run the tests
> npm run dev-test

# Build for production (automatically called by npm install)
> npm run build
```

## Contributions

Contributions are *very* welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xo-server-transport-slack/issues)
  you've encountered;
- fork and create a pull request.

## License

AGPL3 © [Vates SAS](https://vates.fr)
