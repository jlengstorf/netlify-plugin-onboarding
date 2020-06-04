const fs = require('fs-extra');

function getSiteName(url = 'https://1234eaf--your-netlity-site.netlify.app/') {
  const [, partial] = url.split('--');
  const [siteName] = partial.split('.');

  return siteName;
}

exports.onPreBuild = async ({ inputs, constants, utils, netlifyConfig }) => {
  const siteName = getSiteName(process.env.DEPLOY_URL);
  const requiredEnvVars = Object.keys(netlifyConfig.template.environment);

  if (requiredEnvVars.every((envVar) => process.env.hasOwnProperty(envVar))) {
    return;
  }

  utils.status.show({
    title: inputs.messageHeading,
    summary: inputs.messageSummary.replace(
      '{{env_vars}}',
      requiredEnvVars.join(', '),
    ),
    text: inputs.messageDetails.replace('{{site_url}}', process.env.URL),
  });

  fs.emptyDirSync(`${__dirname}/template`);

  await utils.run('git', [
    'clone',
    inputs.templateRepository,
    `${__dirname}/template`,
  ]);

  process.env.REQUIRED_ENV_VARS = JSON.stringify(
    netlifyConfig.template.environment,
  );
  process.env.SITE_NAME = siteName;

  await utils.run('npm', ['i', '--prefix', `${__dirname}/template`]);
  await utils.run('npm', ['run', 'build', '--prefix', `${__dirname}/template`]);

  fs.copySync(`${__dirname}/template/dist`, `${constants.PUBLISH_DIR}`, {
    overwrite: true,
  });
};
