# Lambda Functions

This document provides detailed information about the Lambda functions used in the Amazon Connect Post-Contact Survey Solution.

## API Lambda Function

The API Lambda function serves as the backend for the API powering the Amazon Connect Post Call Surveys Manager.

### Function Details

- **Name**: `${AWS::StackName}-surveys-api`
- **Runtime**: Node.js 22.x
- **Handler**: `index.handler`
- **Timeout**: 12 seconds
- **Memory**: Default (128 MB)

### Environment Variables

- `TABLE_SURVEYS_CONFIG`: Name of the DynamoDB table for survey configurations
- `TABLE_SURVEYS_RESULTS`: Name of the DynamoDB table for survey results

### IAM Permissions

- DynamoDB operations on survey configuration and results tables:
  - `dynamodb:PutItem`
  - `dynamodb:DeleteItem`
  - `dynamodb:UpdateItem`
  - `dynamodb:Scan`

### Function Logic

The function handles the following operations:

#### List Surveys

Retrieves all surveys from the configuration table.

```javascript
async function listSurveys() {
  try {
    return await scanTable(process.env.TABLE_SURVEYS_CONFIG);
  } catch (e) {
    console.log(e);
    return undefined;
  }
}
```

#### Create/Update Survey

Creates or updates a survey configuration.

```javascript
// Transform questions array into object with numbered keys
let questions = {};
surveyData.questions.forEach((question, index) => {
  questions[`question_${index + 1}`] = question;
});

// Transform flags array into object with numbered keys
let flags = {};
surveyData.flags.forEach((flag, index) => {
  flags[`flag_question_${index + 1}`] = flag;
});

// Generate new UUID if surveyId not provided
const surveyId = surveyData.surveyId || uuid();

// Prepare and execute DynamoDB put operation
const putCommand = new PutCommand({
  TableName: process.env.TABLE_SURVEYS_CONFIG,
  Item: {
    surveyId,
    surveyName: surveyData.surveyName,
    min: surveyData.min,
    max: surveyData.max,
    introPrompt: surveyData.introPrompt,
    outroPrompt: surveyData.outroPrompt,
    ...questions,
    ...flags
  }
});

await docClient.send(putCommand);
```

#### Delete Survey

Deletes a survey configuration.

```javascript
const deleteCommand = new DeleteCommand({
  TableName: process.env.TABLE_SURVEYS_CONFIG,
  Key: {
    surveyId: surveyIdToDelete
  }
});

await docClient.send(deleteCommand);
```

#### Get Survey Results

Retrieves survey results for a specific survey.

```javascript
const scanCommand = new ScanCommand({
  TableName: process.env.TABLE_SURVEYS_RESULTS,
  FilterExpression: "surveyId = :id",
  ExpressionAttributeValues: {
    ":id": JSON.parse(event.body).data.surveyId
  }
});

const results = await getResults(scanCommand);
```

### Error Handling

The function includes comprehensive error handling:

```javascript
try {
  // Operation code
} catch (error) {
  console.log(error);
  response.statusCode = 500;
  body.success = false;
  body.message = "Something went terribly wrong.";
}
```

### Request Validation

The function validates incoming requests:

```javascript
function validateRequest() {
  if (event.httpMethod === 'POST') {
    try {
      var body = JSON.parse(event.body);
    } catch (e) {
      console.log(e);
      response.statusCode = 400;
      response.body = "Body is not valid JSON";
      return false;
    }

    if (!body.operation) {
      response.statusCode = 400;
      response.body = "No operation specified";
      return false;
    }

    if (!OPERATIONS.includes(body.operation)) {
      response.statusCode = 400;
      response.body = "Unsupported operation";
      return false;
    }

    operation = body.operation;
  }

  return true;
}
```

## GetSurveyConfig Lambda Function

The GetSurveyConfig Lambda function retrieves survey configuration from DynamoDB for use in Amazon Connect contact flows.

### Function Details

- **Name**: `${AWS::StackName}-surveys-get-survey-config`
- **Runtime**: Node.js 22.x
- **Handler**: `index.handler`
- **Timeout**: 12 seconds
- **Memory**: Default (128 MB)

### Environment Variables

- `TABLE`: Name of the DynamoDB table for survey configurations

### IAM Permissions

- DynamoDB operations on survey configuration table:
  - `dynamodb:GetItem`
  - `dynamodb:Scan`

### Function Logic

The function retrieves a survey configuration by ID:

```javascript
// Prepare DynamoDB query parameters
const params = {
  TableName: process.env.TABLE,
  Key: {
    'surveyId': event.Details.Parameters.surveyId
  }
};

// Fetch survey configuration from DynamoDB
const command = new GetCommand(params);
const result = await docClient.send(command);

if (result.Item) {
  response.message = 'OK';
  
  // Count the number of questions in the survey
  let questionCount = 0;
  
  // Process each field in the DynamoDB item
  Object.keys(result.Item).forEach(key => {
    // Copy the item value to the response
    response[key] = result.Item[key];
    
    // Count fields that start with 'question' to determine survey size
    if (key.startsWith('question')) {
      questionCount++;
    }
  });
  
  // Add the total number of questions to the response
  response.surveySize = questionCount;
} else {
  // If no survey found, return appropriate message
  response.message = `Couldn't find configuration for survey with id [${event.Details.Parameters.surveyId}]`;
}
```

### Error Handling

The function includes error handling:

```javascript
try {
  // Operation code
} catch (err) {
  console.log(err);
}
```

## WriteSurveyResults Lambda Function

The WriteSurveyResults Lambda function stores survey responses in DynamoDB.

### Function Details

- **Name**: `${AWS::StackName}-surveys-write-results`
- **Runtime**: Node.js 22.x
- **Handler**: `index.handler`
- **Timeout**: 12 seconds
- **Memory**: Default (128 MB)

### Environment Variables

- `TABLE`: Name of the DynamoDB table for survey results

### IAM Permissions

- DynamoDB operations on survey results table:
  - `dynamodb:PutItem`

### Function Logic

The function stores survey responses in DynamoDB:

```javascript
// Initialize object to store survey results
const surveyResults = {};
// Get all attributes from the contact data
const data = event.Details.ContactData.Attributes;

// Extract survey-related attributes from contact data
// Only process attributes that start with "survey_result_"
Object.keys(data).forEach(element => {
  if (element.startsWith("survey_result_")) {
    surveyResults[element] = data[element];
  }
});

// Prepare DynamoDB item for storage
const params = {
  TableName: process.env.TABLE,
  Item: {
    // Store contact ID as primary key
    contactId: event.Details.ContactData.ContactId,
    // Store survey ID for reference
    surveyId: event.Details.ContactData.Attributes.surveyId,
    // Spread survey results into the item
    ...surveyResults,
    // Add Unix timestamp for when the results were stored
    timestamp: Math.floor(Date.now() / 1000)
  }
};

// Write survey results to DynamoDB
const command = new PutCommand(params);
await docClient.send(command);
```

### Error Handling

The function includes error handling:

```javascript
try {
  // Operation code
} catch (err) {
  console.log(err);
}
```

## ProcessSurveyFlags Lambda Function

The ProcessSurveyFlags Lambda function evaluates survey responses against thresholds and creates tasks in Amazon Connect.

### Function Details

- **Name**: `${AWS::StackName}-process-survey-flags`
- **Runtime**: Node.js 22.x
- **Handler**: `index.handler`
- **Timeout**: 12 seconds
- **Memory**: Default (128 MB)

### Environment Variables

- `CONTACT_FLOW_ID`: ID of the contact flow for tasks
- `INSTANCE_NAME`: Name of the Amazon Connect instance

### IAM Permissions

- Amazon Connect operations:
  - `connect:StartTaskContact`

### Function Logic

The function evaluates survey responses against thresholds:

```javascript
// Object to store questions that were flagged
let flagged = {};

// Get all survey result keys from contact attributes
let surveyKeys = Object.keys(event.Details.ContactData.Attributes)
  .filter((o) => o.startsWith("survey_result_"));
surveyKeys.sort();

// Process each survey question to check for flags
surveyKeys.forEach((key, index) => {
  console.log(`Processing ${key}`);
  
  // Check if a flag threshold exists for this question
  if (
    event.Details.Parameters[`flag_question_${index + 1}`] &&
    event.Details.Parameters[`flag_question_${index + 1}`] != ""
  ) {
    console.log(
      `Flag exists for ${key} with threshold ${event.Details.Parameters[`flag_question_${index + 1}`]}`
    );
    
    // Compare response value against flag threshold
    if (
      parseInt(event.Details.ContactData.Attributes[key]) <=
      parseInt(event.Details.Parameters[`flag_question_${index + 1}`])
    ) {
      flagged[key] = event.Details.Parameters[`flag_question_${index + 1}`];
    }
  }
});
```

If any responses are flagged, the function creates a task in Amazon Connect:

```javascript
// If any responses were flagged, create a task
if (Object.keys(flagged).length > 0) {
  // Extract instance ID from the ARN
  let instanceId = event["Details"]["ContactData"]["InstanceARN"].rsplit("/", 1)[1];
  let description = "";

  // Build description including all flagged questions
  Object.keys(flagged).forEach((key) => {
    description += `Question ${key.substr(key.length - 1)}: ${
      event["Details"]["ContactData"]["Attributes"][key]
    }\n`;
  });

  // Prepare parameters for creating the task
  const params = {
    ContactFlowId: process.env.CONTACT_FLOW_ID,
    InstanceId: instanceId,
    Name: "Flagged Post Call Survey",
    Attributes: {
      surveyId: event["Details"]["ContactData"]["Attributes"]["surveyId"],
      contactId: event["Details"]["ContactData"]["ContactId"],
    },
    ClientToken: uuid(),
    Description: description,
    References: {
      CTR: {
        Type: "URL",
        Value: `https://${process.env.INSTANCE_NAME}.my.connect.aws/contact-trace-records/details/${event["Details"]["ContactData"]["ContactId"]}`,
      },
    },
  };

  // Create task in Connect using SDK v3
  const command = new StartTaskContactCommand(params);
  await connect.send(command);
}
```

### Error Handling

The function includes error handling:

```javascript
try {
  // Operation code
} catch (err) {
  console.log(err);
}
```

## SurveyUtils Lambda Function

The SurveyUtils Lambda function provides utility functions for survey flow management.

### Function Details

- **Name**: `${AWS::StackName}-utils`
- **Runtime**: Node.js 22.x
- **Handler**: `index.handler`
- **Timeout**: 12 seconds
- **Memory**: Default (128 MB)

### Function Logic

The function handles the following operations:

#### Get Next Survey Question

Gets the next question in the survey:

```javascript
function getNextSurveyQuestion() {
  let res = {
    currentQuestionIndex: event.Details.ContactData.Attributes.loopCounter,
    nextQuestion: event.Details.Parameters[`question_${event.Details.ContactData.Attributes.loopCounter}`],
    newCounter: parseInt(event.Details.ContactData.Attributes.loopCounter) + 1
  };
  
  return res;
}
```

#### Validate Input

Validates user input against min/max bounds:

```javascript
function validateInput() {
  let min = event.Details.Parameters.min;
  let max = event.Details.Parameters.max;
  
  return parseInt(min) <= parseInt(event.Details.Parameters.input) && 
    parseInt(max) >= parseInt(event.Details.Parameters.input);
}
```

### Error Handling

The function includes basic error handling by returning a success message if no operation is specified:

```javascript
if (!operation) {
  response.success = true;
  response.message = "No operation in input. Nothing to do.";
  return response;
}
```

## CognitoValidateUser Lambda Function

The CognitoValidateUser Lambda function validates user authentication through Amazon Cognito.

### Function Details

- **Name**: Custom resource function
- **Runtime**: Node.js 22.x
- **Handler**: `index.handler`
- **Timeout**: 15 seconds
- **Memory**: Default (128 MB)

### IAM Permissions

- Cognito operations:
  - `cognito-idp:AdminUpdateUserAttributes`

### Function Logic

The function updates user attributes in Cognito:

```javascript
// Prepare input for updating user attributes
const input = {
  UserPoolId: event.ResourceProperties.UserPoolId,
  Username: "admin",
  UserAttributes: [
    {
      Name: "email_verified",
      Value: "true",
    },
  ],
};

// Update admin user attributes to verify email
const command = new AdminUpdateUserAttributesCommand(input);
await client.send(command);
```

### Error Handling

The function includes error handling:

```javascript
try {
  // Operation code
} catch (e) {
  console.log(e);
  await send(event, context, "FAILED");
}
```
