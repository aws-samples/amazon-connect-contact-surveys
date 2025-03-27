# CloudFormation Parameters

This document provides detailed information about the CloudFormation parameters used in the Amazon Connect Post-Contact Survey Solution.

## Required Parameters

### AmazonConnectInstanceARN

- **Description**: The Amazon Connect instance ARN
- **Type**: String
- **Format**: `arn:aws:connect:region:account-id:instance/instance-id`
- **Example**: `arn:aws:connect:us-west-2:123456789012:instance/12345678-1234-1234-1234-123456789012`
- **How to find it**: 
  1. Log in to the AWS Console
  2. Navigate to Amazon Connect
  3. Select your instance
  4. The ARN is displayed in the instance details

### AmazonConnectInstanceName

- **Description**: The Amazon Connect instance name
- **Type**: String
- **Format**: The name of your Amazon Connect instance
- **Example**: `my-connect-instance`
- **How to find it**: 
  1. Log in to the AWS Console
  2. Navigate to Amazon Connect
  3. The instance name is displayed in the instance list

### ContactFlowIdForTasks

- **Description**: The contact flow you want generated tasks to be directed to
- **Type**: String
- **Format**: The ID of the contact flow
- **Example**: `12345678-1234-1234-1234-123456789012`
- **How to find it**: 
  1. Log in to the Amazon Connect admin console
  2. Navigate to "Routing" > "Contact flows"
  3. Select the contact flow
  4. The ID is in the URL: `/contact-flow/edit?id=<flow-id>`

### AdminEmailAddress

- **Description**: The email address for the initial user of the solution
- **Type**: String
- **Format**: A valid email address
- **Example**: `admin@example.com`
- **Note**: This email address will receive the initial password for the admin user

## CloudFormation Stack Outputs

### WebClient

- **Description**: The frontend access URL
- **Value**: CloudFront distribution domain name
- **Example**: `d1234abcdef.cloudfront.net`
- **Usage**: Access the frontend application using this URL

### AdminUser

- **Description**: The initial admin user for the frontend
- **Value**: Username of the admin user
- **Example**: `admin`
- **Usage**: Use this username with the password sent to the admin email address to log in

## Advanced Configuration

### Customizing the CloudFormation Template

The CloudFormation template can be customized to meet specific requirements:

#### Modifying DynamoDB Capacity

```yaml
SurveysConfigDDBTable:
  Type: AWS::DynamoDB::Table
  Properties:
    # ... other properties ...
    ProvisionedThroughput:
      ReadCapacityUnits: 5  # Modify as needed
      WriteCapacityUnits: 5  # Modify as needed
```

#### Customizing Lambda Function Memory

```yaml
LambdaSurveyApi:
  Type: AWS::Lambda::Function
  Properties:
    # ... other properties ...
    MemorySize: 256  # Modify as needed
```

#### Adding Custom Domain Name

```yaml
CloudFrontDistribution:
  Type: "AWS::CloudFront::Distribution"
  Properties:
    DistributionConfig:
      # ... other properties ...
      Aliases:
        - surveys.example.com
```

#### Enabling DynamoDB Auto Scaling

```yaml
SurveysConfigTableReadCapacityScalableTarget:
  Type: AWS::ApplicationAutoScaling::ScalableTarget
  Properties:
    MaxCapacity: 100
    MinCapacity: 1
    ResourceId: !Sub table/${SurveysConfigDDBTable}
    RoleARN: !GetAtt ScalingRole.Arn
    ScalableDimension: dynamodb:table:ReadCapacityUnits
    ServiceNamespace: dynamodb
```

## Deployment Considerations

### Resource Limits

- **Lambda Functions**: The solution deploys 7 Lambda functions
- **DynamoDB Tables**: The solution creates 2 DynamoDB tables
- **S3 Buckets**: The solution creates 2 S3 buckets
- **CloudFront Distributions**: The solution creates 1 CloudFront distribution
- **Cognito User Pools**: The solution creates 1 Cognito user pool

### Regional Availability

The solution can be deployed in any AWS region that supports the following services:

- Amazon Connect
- AWS Lambda
- Amazon DynamoDB
- Amazon S3
- Amazon CloudFront
- Amazon Cognito
- Amazon API Gateway
- Amazon Lex

### Cost Considerations

The solution uses the following billable AWS resources:

- **Lambda Functions**: Charged based on invocation count and execution time
- **DynamoDB Tables**: Charged based on provisioned capacity and storage
- **S3 Buckets**: Charged based on storage and requests
- **CloudFront Distribution**: Charged based on data transfer and requests
- **API Gateway**: Charged based on API calls
- **Cognito User Pool**: Free tier available, then charged per MAU
- **Amazon Lex**: Charged per request

For detailed pricing information, refer to the AWS Pricing Calculator.
