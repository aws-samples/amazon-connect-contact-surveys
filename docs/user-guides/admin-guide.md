# Administrator Guide

This guide provides detailed instructions for administrators of the Amazon Connect Post-Contact Survey Solution.

## Table of Contents

- [Accessing the Admin Interface](#accessing-the-admin-interface)
- [User Management](#user-management)
- [System Configuration](#system-configuration)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Troubleshooting](#troubleshooting)

## Accessing the Admin Interface

### Initial Login

1. Access the frontend application using the URL provided in the CloudFormation outputs
2. Log in using the admin credentials sent to the specified email address
   - Username: `admin`
   - Password: Check your email for the temporary password
3. You will be prompted to change your password on first login

### Password Requirements

- Minimum length: 8 characters
- Must include at least one:
  - Uppercase letter
  - Lowercase letter
  - Number
  - Special character

## User Management

The Amazon Connect Post-Contact Survey Solution uses Amazon Cognito for authentication. User management is performed directly through the AWS Cognito console, not through the frontend application.

### Creating Users

1. Log in to the AWS Console
2. Navigate to Amazon Cognito > User Pools
3. Select the user pool created for the solution (typically named `contact-surveys-user-pool` or similar)
4. Click "Create user"
5. Enter the user's details:
   - Username
   - Email address
   - Temporary password
6. Select "Mark email as verified" if needed
7. Click "Create user"

### Resetting User Passwords

1. Navigate to the Cognito user pool
2. Find the user in the list
3. Click on the username
4. Click "Reset password"
5. Choose whether to send an email with a reset link or set a temporary password directly

### Deactivating Users

1. Navigate to the Cognito user pool
2. Find the user in the list
3. Click on the username
4. Click "Disable user" (or "Delete user" to remove completely)

### Using AWS CLI for User Management

You can also manage users using the AWS CLI:

#### Create a User
```bash
aws cognito-idp admin-create-user \
  --user-pool-id <user-pool-id> \
  --username <username> \
  --user-attributes Name=email,Value=<email> Name=email_verified,Value=true \
  --temporary-password <password>
```

#### Confirm a User
```bash
aws cognito-idp admin-confirm-sign-up \
  --user-pool-id <user-pool-id> \
  --username <username>
```

#### Reset a User's Password
```bash
aws cognito-idp admin-reset-user-password \
  --user-pool-id <user-pool-id> \
  --username <username>
```

## System Configuration

### Configuring Amazon Connect Integration

The integration with Amazon Connect is configured during deployment through the CloudFormation template. To modify the configuration:

1. Update the CloudFormation stack parameters:
   - `AmazonConnectInstanceARN`
   - `AmazonConnectInstanceName`
   - `ContactFlowIdForTasks`

2. Configure contact flows in Amazon Connect to use the survey module

### Configuring Survey Defaults

Survey defaults are configured within each survey. There are no global defaults in the current implementation.

## Monitoring and Maintenance

### Monitoring System Health

Monitor the health of the solution components using AWS CloudWatch:

1. Log in to the AWS Console
2. Navigate to CloudWatch > Dashboards
3. Create a dashboard with widgets for:
   - Lambda function invocations and errors
   - API Gateway requests and latency
   - DynamoDB read/write capacity
   - CloudFront requests and errors

### Viewing Logs

1. Navigate to CloudWatch > Log Groups
2. Find the log groups for the solution components:
   - `/aws/lambda/contact-surveys-surveys-api`
   - `/aws/lambda/contact-surveys-surveys-get-survey-config`
   - `/aws/lambda/contact-surveys-surveys-write-results`
   - `/aws/lambda/contact-surveys-process-survey-flags`
   - `/aws/lambda/contact-surveys-utils`

### Backing Up Data

To back up survey configurations and results:

#### DynamoDB Backup
```bash
aws dynamodb create-backup \
  --table-name contact-surveys-surveys-config \
  --backup-name config-backup-$(date +%Y%m%d)

aws dynamodb create-backup \
  --table-name contact-surveys-surveys-results \
  --backup-name results-backup-$(date +%Y%m%d)
```

#### Export to S3
```bash
aws dynamodb export-table-to-point-in-time \
  --table-arn <table-arn> \
  --s3-bucket <backup-bucket> \
  --s3-prefix <backup-prefix> \
  --export-format DYNAMODB_JSON
```

### Restoring Data

To restore from a DynamoDB backup:

```bash
aws dynamodb restore-table-from-backup \
  --target-table-name contact-surveys-surveys-config-restored \
  --backup-arn <backup-arn>
```

## Troubleshooting

### Common Issues

#### Authentication Issues

**Issue**: "User is not confirmed"

**Solution**:
```bash
aws cognito-idp admin-confirm-sign-up \
  --user-pool-id <user-pool-id> \
  --username <username>
```

#### Survey Creation Failures

**Issue**: Survey creation fails

**Solution**:
1. Check Lambda CloudWatch logs: `/aws/lambda/contact-surveys-surveys-api`
2. Verify DynamoDB permissions
3. Enable debug logging:
```javascript
const debugMode = true;
console.debug('Survey creation payload:', surveyData);
```

#### Contact Flow Module Not Working

**Issue**: Survey not triggered after contact

**Solution**:
1. Verify the `surveyId` attribute is set correctly
2. Check Lambda CloudWatch logs for errors
3. Verify IAM permissions for Lambda functions

### Accessing CloudWatch Logs

1. Log in to the AWS Console
2. Navigate to CloudWatch > Log Groups
3. Find the log group for the relevant Lambda function
4. Filter logs by:
   - Time range
   - Error message
   - Request ID

### Contacting Support

For additional support:

1. Gather relevant information:
   - Error messages
   - CloudWatch logs
   - Steps to reproduce the issue
2. Contact AWS Support or the solution maintainer
