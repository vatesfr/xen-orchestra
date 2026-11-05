# Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

### Installation

```
$ yarn
```

### Local Development

```
$ yarn start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```
$ yarn build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Deployment

Using SSH:

```
$ USE_SSH=true yarn deploy
```

Not using SSH:

```
$ GIT_USER=<Your GitHub username> yarn deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.

### Feedback follow-up

The page feedback widget accepts an optional email address after a negative vote.
It sends the address as `data.email` in the same Formbricks response as the comment,
only when the visitor selects **Send**. An empty address is omitted; **Skip** saves
only the vote. Email addresses are not included in Matomo events.

Before deploying this widget, add an optional **Open Text** question to the
Formbricks survey configured in `customFields.formbricks`:

- Question ID: `email` (the API key, not just the displayed label).
- Input type: `email`.
- Required: off.
- Label: `Want a follow-up? (optional)`.
- Description: `We'll only use this to ask about your feedback or let you know when it's addressed.`

Keep the existing question IDs and reason choices unchanged. Apply the same field
to the XCP-ng, Xen Orchestra, and Product docs surveys before deploying their
respective widgets. Verify that a response with an email is visible in Formbricks
and that anonymous feedback still works.

Follow-ups are manual. Use the address only to clarify the report or reply once
the correction is live, and record the reply in a private triage note. Do not copy
the address into public issues or pull requests.
