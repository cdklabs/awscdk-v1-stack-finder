const { typescript } = require('projen');
const project = new typescript.TypeScriptProject({
  defaultReleaseBranch: 'main',
  name: 'awscdk-v1-stack-finder',

  bin: {
    'awscdk-v1-stack-finder': 'bin/awscdk-v1-stack-finder',
  },

  autoApproveOptions: {
    allowedUsernames: ['cdklabs-automation'],
    secret: 'GITHUB_TOKEN',
  },
  autoApproveUpgrades: true,

  releaseToNpm: true,
  sampleCode: false,
  deps: [
    'aws-sdk',
    'yaml',
  ],
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // devDeps: [],             /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
});
project.synth();