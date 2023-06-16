import { CdklabsTypeScriptProject } from 'cdklabs-projen-project-types';

const project = new CdklabsTypeScriptProject({
  setNodeEngineVersion: false,
  stability: 'stable',
  private: false,
  defaultReleaseBranch: 'main',
  name: 'awscdk-v1-stack-finder',
  projenrcTs: true,
  majorVersion: 1,

  bin: {
    'awscdk-v1-stack-finder': 'bin/awscdk-v1-stack-finder',
  },

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