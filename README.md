## AWS CDK V1 Stack Finder

Command line tool to identify stacks that were deployed with AWS CDK V1 (as opposed to V2).
You can use this to help with the migration process from V1 to V2.

## Usage

Configure you AWS credentials as normal, and run:

```console
npx awscdk-v1-stack-finder
```

By default, this will scan all regions in your account (apart from `us-iso-east-1` and `us-iso-west-1`)
and print the stacks that were deployed with AWS CDK V1:

```console
❯ npx awscdk-v1-stack-finder
us-east-1: fetching stacks
us-east-1: complete
eu-west-1: fetching stacks
eu-west-1: complete
us-west-1: fetching stacks
us-west-1: complete
ap-southeast-1: fetching stacks
ap-southeast-1: complete
ap-northeast-1: fetching stacks
ap-northeast-1: complete
...
...
...

Found 12 AWS CDK V1 stacks:

name: us-east-1-v1-CdkStack-5 | id: arn:aws:cloudformation:us-east-1:123456789999:stack/us-east-1-v1-CdkStack-5/8dba4af0-ec83-11ec-b731-12920c137c03
name: us-east-1-v1-CdkStack-4 | id: arn:aws:cloudformation:us-east-1:123456789999:stack/us-east-1-v1-CdkStack-4/543baa30-ec83-11ec-8b26-0e62bae32ce5
name: us-east-1-v1-CdkStack-3 | id: arn:aws:cloudformation:us-east-1:123456789999:stack/us-east-1-v1-CdkStack-3/1df2e010-ec83-11ec-abb7-0ed4b803f023
name: us-east-1-v1-CdkStack-2 | id: arn:aws:cloudformation:us-east-1:123456789999:stack/us-east-1-v1-CdkStack-2/e7706850-ec82-11ec-ab94-0a18c92d7bc5
name: us-east-1-v1-CdkStack-1 | id: arn:aws:cloudformation:us-east-1:123456789999:stack/us-east-1-v1-CdkStack-1/adec4950-ec82-11ec-8704-0a59224ca017
name: us-east-1-v1-CdkStack-0 | id: arn:aws:cloudformation:us-east-1:123456789999:stack/us-east-1-v1-CdkStack-0/7421ab70-ec82-11ec-8f7a-0ad10107c705
name: us-east-2-v1-CdkStack-5 | id: arn:aws:cloudformation:us-east-2:123456789999:stack/us-east-2-v1-CdkStack-5/da55d860-ec84-11ec-b1a9-06f24f6851ca
name: us-east-2-v1-CdkStack-4 | id: arn:aws:cloudformation:us-east-2:123456789999:stack/us-east-2-v1-CdkStack-4/a36adad0-ec84-11ec-b55d-0a7b3c2a4574
name: us-east-2-v1-CdkStack-3 | id: arn:aws:cloudformation:us-east-2:123456789999:stack/us-east-2-v1-CdkStack-3/693f0a20-ec84-11ec-a89c-0a27eef80a54
name: us-east-2-v1-CdkStack-2 | id: arn:aws:cloudformation:us-east-2:123456789999:stack/us-east-2-v1-CdkStack-2/32393190-ec84-11ec-ad0b-0a46add5eab0
name: us-east-2-v1-CdkStack-1 | id: arn:aws:cloudformation:us-east-2:123456789999:stack/us-east-2-v1-CdkStack-1/fb30c0f0-ec83-11ec-94ea-02306812ac04
name: us-east-2-v1-CdkStack-0 | id: arn:aws:cloudformation:us-east-2:123456789999:stack/us-east-2-v1-CdkStack-0/c41febe0-ec83-11ec-8d9d-020bb84204d2
```

You can also pass explicit regions using the `AWS_REGIONS` environment variable:

```console
❯ AWS_REGIONS=us-east-1,us-east-2 npx awscdk-v1-stack-finder
us-east-1: fetching stacks
us-east-1: complete
us-east-2: fetching stacks
us-east-2: complete

Found 12 AWS CDK V1 stacks:

name: us-east-1-v1-CdkStack-5 | id: arn:aws:cloudformation:us-east-1:123456789999:stack/us-east-1-v1-CdkStack-5/8dba4af0-ec83-11ec-b731-12920c137c03
name: us-east-1-v1-CdkStack-4 | id: arn:aws:cloudformation:us-east-1:123456789999:stack/us-east-1-v1-CdkStack-4/543baa30-ec83-11ec-8b26-0e62bae32ce5
name: us-east-1-v1-CdkStack-3 | id: arn:aws:cloudformation:us-east-1:123456789999:stack/us-east-1-v1-CdkStack-3/1df2e010-ec83-11ec-abb7-0ed4b803f023
name: us-east-1-v1-CdkStack-2 | id: arn:aws:cloudformation:us-east-1:123456789999:stack/us-east-1-v1-CdkStack-2/e7706850-ec82-11ec-ab94-0a18c92d7bc5
name: us-east-1-v1-CdkStack-1 | id: arn:aws:cloudformation:us-east-1:123456789999:stack/us-east-1-v1-CdkStack-1/adec4950-ec82-11ec-8704-0a59224ca017
name: us-east-1-v1-CdkStack-0 | id: arn:aws:cloudformation:us-east-1:123456789999:stack/us-east-1-v1-CdkStack-0/7421ab70-ec82-11ec-8f7a-0ad10107c705
name: us-east-2-v1-CdkStack-5 | id: arn:aws:cloudformation:us-east-2:123456789999:stack/us-east-2-v1-CdkStack-5/da55d860-ec84-11ec-b1a9-06f24f6851ca
name: us-east-2-v1-CdkStack-4 | id: arn:aws:cloudformation:us-east-2:123456789999:stack/us-east-2-v1-CdkStack-4/a36adad0-ec84-11ec-b55d-0a7b3c2a4574
name: us-east-2-v1-CdkStack-3 | id: arn:aws:cloudformation:us-east-2:123456789999:stack/us-east-2-v1-CdkStack-3/693f0a20-ec84-11ec-a89c-0a27eef80a54
name: us-east-2-v1-CdkStack-2 | id: arn:aws:cloudformation:us-east-2:123456789999:stack/us-east-2-v1-CdkStack-2/32393190-ec84-11ec-ad0b-0a46add5eab0
name: us-east-2-v1-CdkStack-1 | id: arn:aws:cloudformation:us-east-2:123456789999:stack/us-east-2-v1-CdkStack-1/fb30c0f0-ec83-11ec-94ea-02306812ac04
name: us-east-2-v1-CdkStack-0 | id: arn:aws:cloudformation:us-east-2:123456789999:stack/us-east-2-v1-CdkStack-0/c41febe0-ec83-11ec-8d9d-020bb84204d2
```

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This project is licensed under the Apache-2.0 License.

