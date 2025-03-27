# Amazon Connect Post-Contact Survey Solution Documentation

Welcome to the comprehensive documentation for the Amazon Connect Post-Contact Survey Solution. This documentation provides detailed information about the architecture, components, and usage of the solution.

## Documentation Structure

- **[Architecture](./architecture/README.md)**: System design, component relationships, and data flows
- **[Frontend](./frontend/README.md)**: React application structure, components, and state management
- **[Backend](./backend/README.md)**: Lambda functions, DynamoDB tables, and AWS service integrations
- **[API](./api/README.md)**: API specifications, endpoints, and usage examples
- **[Deployment](./deployment/README.md)**: Deployment guides, prerequisites, and configuration
- **[User Guides](./user-guides/README.md)**: End-user and administrator guides

## Solution Overview

The Amazon Connect Post-Contact Survey Solution enables organizations to gather customer feedback through automated surveys after contact center interactions. The solution supports custom survey configurations and automated task creation based on response thresholds.

### Key Features

- **Customizable Surveys**: Create and manage surveys with configurable questions and rating scales
- **Multi-Channel Support**: Collect feedback via voice (DTMF) and chat interactions
- **Automated Task Creation**: Generate tasks for agents when survey responses meet specific criteria
- **Secure Authentication**: Admin interface protected by Amazon Cognito
- **Comprehensive Reporting**: View and analyze survey results through the admin interface

### Technology Stack

- **Frontend**: React.js
- **Backend**: AWS Lambda (Node.js)
- **Database**: Amazon DynamoDB
- **Authentication**: Amazon Cognito
- **Contact Center**: Amazon Connect
- **API**: Amazon API Gateway
- **Content Delivery**: Amazon CloudFront
- **Storage**: Amazon S3

For a quick start guide, see the [Deployment Guide](./deployment/README.md).
