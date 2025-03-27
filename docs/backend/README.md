# Backend Documentation

The backend of the Amazon Connect Post-Contact Survey Solution is built using AWS Lambda functions, DynamoDB tables, and other AWS services. This document provides detailed information about the backend components and their interactions.

## Lambda Functions

### API Lambda Function

The API Lambda function handles API requests from the frontend application.

**File:** `lambdas/api/index.js`

**Purpose:**
- Processes API requests for survey operations
- Handles CRUD operations for surveys
- Retrieves survey results

**Operations:**
- `list`: Retrieves all surveys
- `create`: Creates a new survey
- `update`: Updates an existing survey
- `delete`: Deletes a survey
- `results`: Retrieves survey results

**Environment Variables:**
- `TABLE_SURVEYS_CONFIG`: Name of the DynamoDB table for survey configurations
- `TABLE_SURVEYS_RESULTS`: Name of the DynamoDB table for survey results

**Example Request:**
```json
{
  "operation": "create",
  "data": {
    "surveyName": "Customer Satisfaction",
    "min": 1,
    "max": 5,
    "introPrompt": "Please rate your experience",
    "outroPrompt": "Thank you for your feedback",
    "questions": [
      "How satisfied were you with our service?",
      "How likely are you to recommend us?"
    ],
    "flags": [3, 3]
  }
}
```

**Example Response:**
```json
{
  "success": true,
  "data": "550e8400-e29b-41d4-a716-446655440000"
}
```

### GetSurveyConfig Lambda Function

Retrieves survey configuration from DynamoDB for use in Amazon Connect contact flows.

**File:** `lambdas/getSurveyConfig/index.js`

**Purpose:**
- Retrieves survey configuration from DynamoDB
- Formats survey data for use in Amazon Connect

**Environment Variables:**
- `TABLE`: Name of the DynamoDB table for survey configurations

**Example Request:**
```json
{
  "Details": {
    "Parameters": {
      "surveyId": "550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

**Example Response:**
```json
{
  "statusCode": 200,
  "message": "OK",
  "surveyId": "550e8400-e29b-41d4-a716-446655440000",
  "surveyName": "Customer Satisfaction",
  "min": 1,
  "max": 5,
  "introPrompt": "Please rate your experience",
  "outroPrompt": "Thank you for your feedback",
  "question_1": "How satisfied were you with our service?",
  "question_2": "How likely are you to recommend us?",
  "flag_question_1": 3,
  "flag_question_2": 3,
  "surveySize": 2
}
```

### WriteSurveyResults Lambda Function

Stores survey responses in DynamoDB.

**File:** `lambdas/writeSurveyResults/index.js`

**Purpose:**
- Stores survey responses in DynamoDB
- Processes survey attributes from Amazon Connect

**Environment Variables:**
- `TABLE`: Name of the DynamoDB table for survey results

**Example Request:**
```json
{
  "Details": {
    "ContactData": {
      "ContactId": "12345678-1234-1234-1234-123456789012",
      "Attributes": {
        "surveyId": "550e8400-e29b-41d4-a716-446655440000",
        "survey_result_1": "4",
        "survey_result_2": "5"
      }
    }
  }
}
```

**Example Response:**
```json
{
  "statusCode": 200,
  "body": "OK"
}
```

### ProcessSurveyFlags Lambda Function

Evaluates survey responses against thresholds and creates tasks in Amazon Connect.

**File:** `lambdas/processReviewFlags/index.js`

**Purpose:**
- Evaluates survey responses against thresholds
- Creates tasks in Amazon Connect for flagged responses

**Environment Variables:**
- `CONTACT_FLOW_ID`: ID of the contact flow for tasks
- `INSTANCE_NAME`: Name of the Amazon Connect instance

**Example Request:**
```json
{
  "Details": {
    "ContactData": {
      "ContactId": "12345678-1234-1234-1234-123456789012",
      "InstanceARN": "arn:aws:connect:us-west-2:123456789012:instance/12345678-1234-1234-1234-123456789012",
      "Attributes": {
        "surveyId": "550e8400-e29b-41d4-a716-446655440000",
        "survey_result_1": "2",
        "survey_result_2": "5"
      }
    },
    "Parameters": {
      "flag_question_1": "3",
      "flag_question_2": "3"
    }
  }
}
```

**Example Response:**
```json
{
  "statusCode": 200,
  "body": "OK"
}
```

### SurveyUtils Lambda Function

Provides utility functions for survey flow management.

**File:** `lambdas/surveyUtils/index.js`

**Purpose:**
- Manages survey flow in Amazon Connect
- Validates user input
- Retrieves next survey question

**Operations:**
- `getNextSurveyQuestion`: Gets the next question in the survey
- `validateInput`: Validates user input against min/max bounds

**Example Request:**
```json
{
  "Details": {
    "Parameters": {
      "operation": "getNextSurveyQuestion",
      "question_1": "How satisfied were you with our service?",
      "question_2": "How likely are you to recommend us?"
    },
    "ContactData": {
      "Attributes": {
        "loopCounter": "1"
      }
    }
  }
}
```

**Example Response:**
```json
{
  "operation": "getNextSurveyQuestion",
  "nextQuestion": "How satisfied were you with our service?",
  "newCounter": 2,
  "currentQuestionIndex": "1"
}
```

### CognitoValidateUser Lambda Function

Validates user authentication through Amazon Cognito.

**File:** `lambdas/cognitoValidateUser/index.js`

**Purpose:**
- Validates user authentication
- Updates user attributes in Cognito

**Example Request:**
```json
{
  "ResourceProperties": {
    "UserPoolId": "us-west-2_abcdefghi",
    "Username": "admin"
  }
}
```

**Example Response:**
```json
{
  "statusCode": 200,
  "body": {}
}
```

## DynamoDB Tables

### SurveysConfigDDBTable

Stores survey configurations.

**Schema:**
- `surveyId` (String): Primary key
- `surveyName` (String): Name of the survey
- `min` (Number): Minimum rating value
- `max` (Number): Maximum rating value
- `introPrompt` (String): Introduction prompt
- `outroPrompt` (String): Conclusion prompt
- `question_1`, `question_2`, etc. (String): Survey questions
- `flag_question_1`, `flag_question_2`, etc. (Number): Flag thresholds

**Example Item:**
```json
{
  "surveyId": "550e8400-e29b-41d4-a716-446655440000",
  "surveyName": "Customer Satisfaction",
  "min": 1,
  "max": 5,
  "introPrompt": "Please rate your experience",
  "outroPrompt": "Thank you for your feedback",
  "question_1": "How satisfied were you with our service?",
  "question_2": "How likely are you to recommend us?",
  "flag_question_1": 3,
  "flag_question_2": 3
}
```

### SurveysResultsDDBTable

Stores survey responses.

**Schema:**
- `contactId` (String): Primary key
- `surveyId` (String): ID of the survey
- `survey_result_1`, `survey_result_2`, etc. (String): Survey responses
- `timestamp` (Number): Unix timestamp

**Example Item:**
```json
{
  "contactId": "12345678-1234-1234-1234-123456789012",
  "surveyId": "550e8400-e29b-41d4-a716-446655440000",
  "survey_result_1": "4",
  "survey_result_2": "5",
  "timestamp": 1647532800
}
```

## Amazon Connect Integration

### Contact Flow Module

The Contact Flow Module executes the survey flow after a contact ends.

**Key Components:**
- Invokes GetSurveyConfig Lambda to retrieve survey configuration
- Presents questions to the customer
- Collects responses via DTMF (voice) or Lex (chat)
- Invokes WriteSurveyResults Lambda to store responses
- Invokes ProcessSurveyFlags Lambda to evaluate responses

**Flow Logic:**
1. Retrieve survey configuration
2. Present introduction prompt
3. Loop through survey questions
4. Collect and validate responses
5. Store responses
6. Evaluate responses against thresholds
7. Present conclusion prompt

### Amazon Lex Bot

The Amazon Lex Bot processes text responses for chat-based surveys.

**Intents:**
- `0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`: Numeric responses
- `FallbackIntent`: Default intent when no other intent matches

**Utterances:**
- Numeric values (0-9)

## Error Handling

### Lambda Error Handling

```javascript
try {
  // Operation code
} catch (err) {
  console.log(err);
  return {
    statusCode: 500,
    body: JSON.stringify({ error: 'Internal server error' })
  };
}
```

### DynamoDB Error Handling

```javascript
try {
  const command = new PutCommand(params);
  await docClient.send(command);
} catch (err) {
  console.log(err);
  throw err;
}
```

### Connect Flow Error Handling

The Contact Flow Module includes error handling branches for:
- Lambda invocation errors
- Invalid user input
- Timeout errors

## Logging and Monitoring

### CloudWatch Logs

All Lambda functions log to CloudWatch Logs:

```javascript
console.log('Processing survey response:', event);
```

### API Gateway Logging

API Gateway is configured with ERROR level logging:

```json
{
  "MethodSettings": [
    {
      "DataTraceEnabled": true,
      "HttpMethod": "*",
      "LoggingLevel": "ERROR",
      "ResourcePath": "/*"
    }
  ]
}
```

## Security

### IAM Roles

Each Lambda function has a specific IAM role with least privilege permissions:

- `LambdaSurveysApiRole`: Permissions for API operations
- `LambdaGetSurveyConfigRole`: Permissions to read survey configurations
- `LambdaWriteSurveyResultsRole`: Permissions to write survey results
- `LambdaProcessSurveysFlagsRole`: Permissions to create tasks in Connect

### API Gateway Authorization

API Gateway uses Cognito User Pools for authorization:

```json
{
  "AuthorizationType": "COGNITO_USER_POOLS",
  "AuthorizerId": "CognitoAuthorizer"
}
```

### DynamoDB Encryption

DynamoDB tables use server-side encryption:

```json
{
  "SSESpecification": {
    "Enabled": true
  }
}
```
