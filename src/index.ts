import * as zlib from 'zlib';
import * as AWS from 'aws-sdk';
import { AWSError } from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';
import * as YAML from 'yaml';

const ALL_STATUSES_EXCEPT_DELETE_COMPLETE = [
  'CREATE_IN_PROGRESS',
  'CREATE_FAILED',
  'CREATE_COMPLETE',
  'ROLLBACK_IN_PROGRESS',
  'ROLLBACK_FAILED',
  'ROLLBACK_COMPLETE',
  'DELETE_IN_PROGRESS',
  'DELETE_FAILED',
  'UPDATE_IN_PROGRESS',
  'UPDATE_COMPLETE_CLEANUP_IN_PROGRESS',
  'UPDATE_COMPLETE',
  'UPDATE_FAILED',
  'UPDATE_ROLLBACK_IN_PROGRESS',
  'UPDATE_ROLLBACK_FAILED',
  'UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS',
  'UPDATE_ROLLBACK_COMPLETE',
  'REVIEW_IN_PROGRESS',
  'IMPORT_IN_PROGRESS',
  'IMPORT_COMPLETE',
  'IMPORT_ROLLBACK_IN_PROGRESS',
  'IMPORT_ROLLBACK_FAILED',
  'IMPORT_ROLLBACK_COMPLETE',
];

const DEFAULT_AWS_REGIONS = [
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
  'eu-south-2', // Europe (Spain)
  'ap-southeast-3', // Asia Pacific (Jakarta) 29
  'me-central-1', // Middle East (UAE)
  'eu-central-2', // Europe (Zurich)
  'ap-south-2', // Asia Pacific (Hyderabad)
  'ap-southeast-4', // Asia Pacific (Melbourne)

  // these regions never return the listStacks call for some reason
  // and block the process forever.

  // 'us-iso-east-1', // AWS ISO
  // 'us-iso-west-1', // US ISO West

];

export async function find() {

  const stacks: string[] = [];

  const regions = process.env.AWS_REGIONS ? (process.env.AWS_REGIONS.split(',')) : DEFAULT_AWS_REGIONS;

  for (const region of regions) {

    const cloudformation = new AWS.CloudFormation({ region: region });
    const response = await listStacks(cloudformation, region);
    await processListStacksResponse(response, cloudformation, region, stacks);
    console.log(`${region}: complete`);
  }

  console.log('');

  if (stacks.length === 0) {
    console.log('No AWS CDK V1 stacks found');
  } else {
    console.log(`Found ${stacks.length} AWS CDK V1 stacks:`);
    console.log('');
    for (const stack of stacks) {
      console.log(stack);
    }
  }

}

async function listStacks(cloudformation: AWS.CloudFormation, region: string, nextToken?: AWS.CloudFormation.Types.NextToken) {
  console.log(`${region}: fetching stacks ${nextToken ? `(token: ${nextToken})` : ''}`);
  const response = await cloudformation.listStacks({
    StackStatusFilter: ALL_STATUSES_EXCEPT_DELETE_COMPLETE,
    NextToken: nextToken,
  }).promise().catch((error) => console.error(`${region}: Failed to list stacks. Error: ${error}`));
  return response;
}


async function processListStacksResponse(
  response: PromiseResult<AWS.CloudFormation.Types.ListStacksOutput, AWSError> | void,
  cloudformation: AWS.CloudFormation,
  region: string,
  stacks: string[]) {
  if (!response) {
    return;
  }

  await findV1Stacks(response, cloudformation, region, stacks);

  if (response.NextToken) {
    // Note: This might be unnecessary, since the ListStacks API keeps
    //       responses up to 1 MB in size all in one page.
    await processNextPage(response.NextToken, cloudformation, region, stacks);
  }
}

async function processNextPage(nextToken: string, cloudformation: AWS.CloudFormation, region: string, stacks: string[]) {
  console.log(`${region}: fetching stacks (page token ${nextToken})`);
  const nextPageResult = await listStacks(cloudformation, region, nextToken);
  console.log(`${region}: finished fetching stacks`);
  await processListStacksResponse(nextPageResult, cloudformation, region, stacks);
}

async function findV1Stacks(
  response: AWS.CloudFormation.Types.ListStacksOutput,
  cloudformation: AWS.CloudFormation,
  region: string,
  stacks: string[]) {

  for (const stack of response.StackSummaries ?? []) {
    const getTemplateResponse = await cloudformation.getTemplate({
      StackName: stack.StackName,
    }).promise().catch((error) => console.error(`${region}: Failed to get template for stack: ${stack.StackName}. Error: ${error}`)) as any;

    var body;
    var jsonErr;
    try {
      body = JSON.parse(getTemplateResponse.TemplateBody);
    } catch (err) { jsonErr = err; }

    if (!body) {
      try {
        body = YAML.parse(getTemplateResponse.TemplateBody);
      } catch (yamlErr) {
        console.error(`${region}: Failed to parse template for stack: ${stack.StackName}. \nJSON Parse Error: ${jsonErr} \nYAML Parse Error: ${yamlErr}`);
      }
    }

    if (body.Resources.CDKMetadata) {
      let stackVersion: undefined | string;

      if (body.Resources.CDKMetadata.Properties?.Analytics) {
        const buf = Buffer.from(body.Resources.CDKMetadata.Properties.Analytics.split(':').splice(2)[0], 'base64');
        const analyticsString = zlib.gunzipSync(buf).toString();
        const constructInfo = decodePrefixEncodedString(analyticsString);
        // Strings look like `<version>!<library>.<construct>`
        const stackConstruct = constructInfo.find(x => x.endsWith('@aws-cdk/core.Stack') || x.endsWith('monocdk.Stack'));
        if (stackConstruct) {
          stackVersion = stackConstruct.split('!')[0];
        }
      }

      // Before versions 1.93.0 and 2.0.0-alpha.10, the CDKMetadata resource had a different format.
      if (body.Resources.CDKMetadata.Properties?.Modules) {
        const modules = body.Resources.CDKMetadata.Properties.Modules.split(',') as string[];
        // Strings look like `<library>=<version>`
        const coreModule = modules.find(m => m.startsWith('@aws-cdk/core=') || m.startsWith('monocdk='));
        if (coreModule) {
          stackVersion = coreModule.split('=')[1];
        }
      }

      if (stackVersion && (stackVersion.startsWith('1.') || stackVersion.startsWith('0.')) && stackVersion !== '0.0.0') {
        stacks.push(`name: ${stack.StackName} | version: ${stackVersion} | id: ${stack.StackId}`);
      }
    }
  }
}

/**
 * Explode the prefix-encoded string
 *
 * Example:
 *     '1.90.0!aws-cdk-lib.{Stack,Construct,service.Resource},0.42.1!aws-cdk-lib-experiments.NewStuff'
 *
 * Becomes:
 *     [1.90.0!aws-cdk-lib.Stack, 1.90.0!aws-cdk-lib.Construct, 1.90.0!aws-cdk-lib.service.Resource, 0.42.1!aws-cdk-lib-experiments.NewStuff]
 */
function decodePrefixEncodedString(x: string) {
  const ret = new Array<string>();
  const prefixes = new Array<string>();
  let current = new StringBuilder();
  let i = 0;
  while (i < x.length) {
    switch (x[i]) {
      case ',':
        if (current.hasChars) {
          ret.push(prefixes.join('') + current.toString());
          current = new StringBuilder();
        }
        break;
      case '}':
        if (current.hasChars) {
          ret.push(prefixes.join('') + current.toString());
        }
        current = new StringBuilder();
        prefixes.pop();
        break;
      case '{':
        prefixes.push(current.toString());
        current = new StringBuilder();
        break;
      default:
        current.append(x[i]);
        break;
    }

    i += 1;
  }
  if (current.hasChars) {
    ret.push(prefixes.join('') + current.toString());
  }

  return ret;
}

class StringBuilder {
  private readonly parts = new Array<string>();
  constructor() {
  }

  public append(x: string) {
    this.parts.push(x);
  }

  public get hasChars() {
    return this.parts.length > 0;
  }

  public toString(): string {
    return this.parts.join('');
  }
}
