---
layout: default
title: Running in an AWS Lambda Function
nav_order: 6
---

# Running in an AWS Lambda Function

The server can be deployed to run in an AWS Lambda. The following steps take you
through creating:

- An S3 bucket to store the artifacts
- An IAM role to grant the Lambda permission to access the bucket
- The Lambda function
- An HTTP API Gateway
- Configuring your repository to use the new API

## Create S3 Bucket to store artifacts
First, create an S3 Bucket with a unique name, such as `turborepo-cache-udaw82`.
Leave **Block all public access** ticked to ensure your artifacts remain
private.

*Note - to prevent this bucket from growing forever, you may want to create a
**Lifecyle rule** to expire cache objects that are older than a certain number
of days.*

## Create an IAM role to grant the Lambda permission to access the bucket
Create a new IAM role. Under **Trusted entity type** choose **AWS service**, and
under **Use case** select **Lambda**. On the **Add permissions** screen, click
**Next**. On the **Name, review, and create** screen create a name for your role
such as `turborepo-cache-lambda-role` then click on **Create role**.

View your new role, and under **Permissions policies** click the button **Add
permissions** and choose **Create inline policy**. Click on **JSON** and add the
following policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:*"
            ],
            "Resource": [
                "arn:aws:s3:::<your_bucket_name>",
                "arn:aws:s3:::<your_bucket_name>/*"
            ]
        }
    ]
}
```

This will only grant the Lambda function access to the artifacts bucket, and no
other S3 resources.

Click on **Review policy** and give your policy a name such as
`turborepo-cache-lambda-policy`, then click on **Create Policy**.

## Create the Lambda Function

Create a new Lambda function with a name like `turborepo-cache-lambda` using the
latest Node.js runtime. Under **Permissions** click on **Change default
execution role**, select **Use an existing role** and select the role you just
created. Click on **Create function**.

### Handler code

The Lambda handler will need the packages `@fastify/aws-lambda` and
`turborepo-remote-cache` installed. Your `index.js` handler code should look
like this:

```js
import awsLambdaFastify from '@fastify/aws-lambda';
import { createApp } from 'turborepo-remote-cache/build/app';

const app = createApp({
	trustProxy: true,
});

const proxy = awsLambdaFastify(app, { enforceBase64: (_) => true });

export const handler = proxy;
```

*Note - how you choose to bundle dependencies and upload the handler code are
outside the scope of this document.*

### Configuration

Under your Lambda **Configuration**, edit the **General configuration** and
increase the timeout to 10 seconds (as the default value of 3 seconds can
sometimes cause timeouts).

Go into **Environment variables** and create the following environment
variables:

| Key              | Value              |
|------------------|--------------------|
| STORAGE_PATH     | <your_bucket_name> | 
| STORAGE_PROVIDER | s3                 |
| TURBO_TOKEN      | <your_secret_key>  |

*See [Environment
variables](https://ducktors.github.io/turborepo-remote-cache/environment-variables)
for more information on configuring these.*

### ARN

Copy your Lambda's ARN for the next step.

## Create an HTTP API Gateway

Go to the API Gateway service, and choose **Create**. Under **HTTP API** click
on **Build**. 

Under **Integrations** click on **Add integration**. Choose **Lambda** and
search for your Lambda's ARN. Enter an API name such as `turborepo-cache-api`.

Under **Configure routes** leave the **Method** as `ANY` and change the
**Resource path** to `$default`. Click on **Next**.

On the **Configure stages** screen, leave the stage name as `$default` and click
on **Next**, then on the **Review and create** screen click on **Create**.

You have now created your API Gateway. Copy the **Invoke URL** and use this to
set up your repository.

## Configuring your repository to use the new API

You will need to enable custom remote caching in your turbo repository - see -
[Enable custom remote caching in a Turborepo
monorepo](https://ducktors.github.io/turborepo-remote-cache/custom-remote-caching)
for more information.

In your `.turbo/config.json`, set your `apiUrl` to your API Gateway **Invoke
URL**.

Your remote `turborepo-remote-cache` API is now ready to use!
