# Deployment Guide

This guide provides detailed instructions for deploying the Amazon Connect Post-Contact Survey Solution.

## Prerequisites

Before deploying the solution, ensure you have the following:

- **AWS Account**: An AWS account with permissions to create the required resources
- **Amazon Connect Instance**: An existing Amazon Connect instance
- **AWS CLI**: Installed and configured with appropriate permissions
- **Node.js**: Version 14.x or later
- **Admin Email Address**: An email address for the initial admin user

## Required Permissions

The deployment requires permissions to create and manage the following AWS resources:

- Lambda functions
- S3 buckets
- IAM roles
- Cognito user pools
- DynamoDB tables
- API Gateway
- CloudFront distributions
- Amazon Lex bots

## Deployment Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd amazon-connect-contact-surveys
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build the Frontend

```bash
npm run build
```

### 4. Deploy the CloudFormation Stack

```bash
aws cloudformation deploy \
  --template-file deployment/contact-surveys-amazon-connect.yaml \
  --stack-name contact-surveys \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    AmazonConnectInstanceARN=<your-connect-instance-arn> \
    AmazonConnectInstanceName=<your-connect-instance-name> \
    ContactFlowIdForTasks=<your-contact-flow-id> \
    AdminEmailAddress=<admin-email>
```

Replace the placeholder values with your specific information:

- `<your-connect-instance-arn>`: The ARN of your Amazon Connect instance
- `<your-connect-instance-name>`: The name of your Amazon Connect instance
- `<your-contact-flow-id>`: The ID of the contact flow you want generated tasks to be directed to
- `<admin-email>`: The email address for the initial admin user

### 5. Get the CloudFormation Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name contact-surveys \
  --query "Stacks[0].Outputs"
```

Note the following outputs:
- `WebClient`: The URL for accessing the frontend application
- `AdminUser`: The initial admin user for the frontend

### 6. Configure Amazon Connect

#### Import the Contact Flow Module

1. Log in to the Amazon Connect admin console
2. Navigate to "Routing" > "Contact flows"
3. Click "Create contact flow" > "Import flow"
4. Upload the contact flow module from the CloudFormation outputs

#### Configure Contact Flows

1. Create or edit a contact flow that will trigger the survey
2. Add a "Transfer to flow" block
3. Select the "Contact Survey" module
4. Configure the parameters:
   - `surveyId`: The ID of the survey to use

### 7. Verify Deployment

1. Access the frontend application using the `WebClient` URL from the CloudFormation outputs
2. Log in using the admin credentials sent to the specified email address
3. Create a test survey
4. Test the survey flow in Amazon Connect

## Post-Deployment Configuration

### Configure Survey Triggers

1. Identify the contact flows where you want to trigger surveys
2. Add a "Set contact attributes" block to set the `surveyId` attribute
3. Add a "Transfer to flow" block to transfer to the "Contact Survey" module

### Configure Task Creation

1. Create a contact flow for handling tasks created by flagged survey responses
2. Update the `ContactFlowIdForTasks` parameter in the CloudFormation stack if needed

### Configure User Access

1. Log in to the Amazon Cognito console
2. Navigate to the user pool created by the CloudFormation stack
3. Add additional users as needed

## Troubleshooting

### Common Issues

#### Cognito User Not Confirmed

**Error**: "User is not confirmed"

**Solution**:
```bash
aws cognito-idp admin-confirm-sign-up \
  --user-pool-id <user-pool-id> \
  --username <username>
```

#### Survey Creation Failures

**Error**: Survey creation fails

**Solution**:
1. Check Lambda CloudWatch logs: `/aws/lambda/contact-surveys-surveys-api`
2. Verify DynamoDB permissions
3. Enable debug logging:
```javascript
const debugMode = true;
console.debug('Survey creation payload:', surveyData);
```

#### Contact Flow Module Not Working

**Error**: Survey not triggered after contact

**Solution**:
1. Verify the `surveyId` attribute is set correctly
2. Check Lambda CloudWatch logs for errors
3. Verify IAM permissions for Lambda functions

#### Frontend Access Issues

**Error**: Unable to access the frontend application

**Solution**:
1. Verify the CloudFront distribution is deployed
2. Check S3 bucket permissions
3. Verify Cognito user pool configuration

## Updating the Solution

To update the solution to a new version:

1. Pull the latest changes from the repository
2. Install dependencies and build the frontend
3. Update the CloudFormation stack:

```bash
aws cloudformation update-stack \
  --stack-name contact-surveys \
  --template-body file://deployment/contact-surveys-amazon-connect.yaml \
  --capabilities CAPABILITY_IAM \
  --parameters \
    ParameterKey=AmazonConnectInstanceARN,UsePreviousValue=true \
    ParameterKey=AmazonConnectInstanceName,UsePreviousValue=true \
    ParameterKey=ContactFlowIdForTasks,UsePreviousValue=true \
    ParameterKey=AdminEmailAddress,UsePreviousValue=true
```

## Uninstalling the Solution

To remove the solution:

```bash
aws cloudformation delete-stack \
  --stack-name contact-surveys
```

Note: This will delete all resources created by the CloudFormation stack, including the DynamoDB tables containing survey configurations and results. Make sure to back up any important data before deleting the stack.
