# Netlify Plugin: Onboarding Assistant

This plugin checks for missing environment variables and deploys a helper page that walks the user through configuring their site.

## Installation

In the repo that you want people to deploy to Netlify, add the plugin and template environment variables to the `netlify.toml`:

```toml
[[plugins]]
  package = "netlify-plugin-onboarding"

[template.environment]
  SOME_ENV_VAR = "Describe what this is/why it’s needed."
  # For example, if you need a GitHub username:
  GITHUB_USERNAME = "Your GitHub Username (e.g. @jlengstorf)"
```

## Configuration

All of these configuration options are optional.

Name | Description | Default Value | Required
---- | ----------- | ------------- | --------
`templateRepository` | The Git repository that contains your onboarding instructions. | "https://github.com/jlengstorf/example-onboarding-flow.git" | `true`
`messageHeading` | If env vars are missing, this is the report headline. | "Missing Required Environment Variables" | `true`
`messageSummary` | If env vars are missing, this is the report summary. | "Missing env vars: {{env_vars}}" | `true`
`messageDetails` | If env vars are missing, this is the report details. | "A temporary homepage has been created with instructions for completing the site setup. Visit {{site_url}} for details." | `true`

## Custom instruction templates

You can create your own instruction template. In order to work properly, two things need to be true:

1. It **MUST** use a build command that is triggered with `npm run build`. If you don’t use a build command, add one that does nothing (e.g. `"build": "# no build command"`)
2. It **MUST** create a file at `dist/index.html`.

It’s possible to create additional pages in addition to `index.html`, but that’s not required.

## Don’t build if the site is missing env vars

Because there’s no way to prevent a build from a build plugin without failing the whole build, the site itself needs to skip building if the env vars are missing.

Here’s an example script that checks the `netlify.toml` for required env vars, then skips the build if they’re not present.

```js
const fs = require('fs');
const toml = require('toml');
const execa = require('execa');

const tomlFile = fs.readFileSync(`${__dirname}/netlify.toml`, 'utf8');
const netlifyConfig = toml.parse(tomlFile);
const requiredEnvVars = Object.keys(netlifyConfig.template.environment);

// if we’re missing the required env vars, we need to
// no-op to avoid a failed build and show the install
// helper page.
if (!requiredEnvVars.every((envVar) => process.env.hasOwnProperty(envVar))) {
  console.log('skipping the build due to missing env vars');
  return;
}

// if we get here, build the site
execa('npm', ['run', 'build']).stdout.pipe(process.stdout);
```

You can save this as `maybe-build.js`, then create a `maybe-build` command in your `package.json`:

```json
  "scripts": {
    "maybe-build": "node maybe-build.js",
    "build": "eleventy --input src --output public"
  },
```

Set this as your `command` in `netlify.toml`:

```toml
[build]
  command = "npm run maybe-build"
```
