const AWS = require('aws-sdk');
const zlib = require('zlib');
const YAML = require('yaml');

const ALL_STATUSES_EXCEPT_DELETE_COMPLETE = [
  "CREATE_IN_PROGRESS",
  "CREATE_FAILED",
  "CREATE_COMPLETE",
  "ROLLBACK_IN_PROGRESS",
  "ROLLBACK_FAILED",
  "ROLLBACK_COMPLETE",
  "DELETE_IN_PROGRESS",
  "DELETE_FAILED",
  "UPDATE_IN_PROGRESS",
  "UPDATE_COMPLETE_CLEANUP_IN_PROGRESS",
  "UPDATE_COMPLETE",
  "UPDATE_FAILED",
  "UPDATE_ROLLBACK_IN_PROGRESS",
  "UPDATE_ROLLBACK_FAILED",
  "UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS",
  "UPDATE_ROLLBACK_COMPLETE",
  "REVIEW_IN_PROGRESS",
  "IMPORT_IN_PROGRESS",
  "IMPORT_COMPLETE",
  "IMPORT_ROLLBACK_IN_PROGRESS",
  "IMPORT_ROLLBACK_FAILED",
  "IMPORT_ROLLBACK_COMPLETE",
];

const AWS_REGIONS = [
  'us-east-1', // US East (N. Virginia)
  'eu-west-1', // Europe (Ireland)
  'us-west-1', // US West (N. California)
  'ap-southeast-1', // Asia Pacific (Singapore)
  'ap-northeast-1', // Asia Pacific (Tokyo)
  'us-gov-west-1', // AWS GovCloud (US-West)
  'us-west-2', // US West (Oregon)
  'sa-east-1', // South America (São Paulo)
  'ap-southeast-2', // Asia Pacific (Sydney)
  'cn-north-1', // China (Beijing)
  'us-iso-east-1', // AWS ISO
  'eu-central-1', // Europe (Frankfurt)
  'ap-northeast-2', // Asia Pacific (Seoul)
  'ap-south-1', // Asia Pacific (Mumbai)
  'us-east-2', // US East (Ohio)
  'ca-central-1', // Canada (Central)
  'eu-west-2', // Europe (London)
  'us-isob-east-1', // AWS ISO-B
  'cn-northwest-1', // China (Ningxia)
  'eu-west-3', // Europe (Paris)
  'ap-northeast-3', // Asia Pacific (Osaka)
  'us-gov-east-1', // AWS GovCloud (US-East)
  'eu-north-1', // Europe (Stockholm)
  'ap-east-1', // Asia Pacific (Hong Kong)
  'me-south-1', // Middle East (Bahrain)
  'eu-south-1', // Europe (Milan)
  'af-south-1', // Africa (Cape Town)
  'us-iso-west-1', // US ISO West
  'eu-south-2', // Europe (Spain)
  'ap-southeast-3', // Asia Pacific (Jakarta) 29
];

AWS_REGIONS.forEach(async (region) => {
  console.log(`${region}: Getting CloudFormation stacks using AWS CDK v1`);
  const cloudformation = new AWS.CloudFormation({
    region: region
  });

  const response = await cloudformation.listStacks({
    StackStatusFilter: ALL_STATUSES_EXCEPT_DELETE_COMPLETE
  }).promise().catch((error) => console.error(`${region}: Failed to list stacks. Error: ${error}`));

  await processListStacksResponse(response, cloudformation, region);
  console.log(`${region}: complete.`)
});

async function processListStacksResponse(response, cloudformation, region) {
  if (!response) {
    return;
  }

  await findV1Stacks(response, cloudformation, region);

  if (response.NextToken) {
    // Note: This might be unnecessary, since the ListStacks API keeps
    //       responses up to 1 MB in size all in one page.
    await processNextPage(response.NextToken, cloudformation, region);
  }
}

async function processNextPage(nextToken, cloudformation, region) {
  const nextPageResult = await cloudformation.listStacks({
    StackStatusFilter: ALL_STATUSES_EXCEPT_DELETE_COMPLETE,
    NextToken: nextToken
  }).promise().catch((error) => console.error(`${region}: Failed to list next page of stacks. Error: ${error}`));
  await processListStacksResponse(nextPageResult, cloudformation, region);
}

async function findV1Stacks(response, cloudformation, region) {
  response.StackSummaries.forEach(async (stack) => {
    const getTemplateResponse = await cloudformation.getTemplate({
      StackName: stack.StackName,
    }).promise().catch((error) => console.error(`${region}: Failed to get template for stack: ${stack.StackName}. Error: ${error}`));

    var body;
    try {
      body = JSON.parse(getTemplateResponse.TemplateBody);
    } catch (err) {
      body = YAML.parse(getTemplateResponse.TemplateBody);
    }
    if (body.Resources.CDKMetadata) {
      const buf = Buffer.from(body.Resources.CDKMetadata.Properties.Analytics.split(':').splice(2)[0], 'base64');
      const analyticsString = zlib.gunzipSync(buf).toString();
      const majorVersion = analyticsString.slice(0,1);
      if (majorVersion === '1') {
        console.log(`${region}: name: ${stack.StackName} id: ${stack.StackId}`);
      }
    }
  });
}
