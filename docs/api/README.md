# API Documentation

The Amazon Connect Post-Contact Survey Solution provides a RESTful API for managing surveys and retrieving results. This document provides detailed information about the API endpoints, request/response formats, and authentication requirements.

## API Overview

The API is built using Amazon API Gateway and AWS Lambda. It provides the following endpoints:

- `/surveys`: Manages survey configurations
- `/results`: Retrieves survey results

## Authentication

All API endpoints require authentication using Amazon Cognito. The API uses the `COGNITO_USER_POOLS` authorization type with a Cognito User Pool Authorizer.

### Authentication Headers

```
Authorization: Bearer <jwt-token>
```

### Obtaining a JWT Token

1. Authenticate with Amazon Cognito using the user credentials
2. Receive a JWT token in the response
3. Include the token in the `Authorization` header of API requests

## API Endpoints

### Survey Management

#### List Surveys

Retrieves all available surveys.

**Request:**
- **Method:** POST
- **Endpoint:** `/surveys`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <jwt-token>`
- **Body:**
  ```json
  {
    "operation": "list"
  }
  ```

**Response:**
- **Status Code:** 200 OK
- **Body:**
  ```json
  {
    "success": true,
    "data": [
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
    ]
  }
  ```

#### Create Survey

Creates a new survey.

**Request:**
- **Method:** POST
- **Endpoint:** `/surveys`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <jwt-token>`
- **Body:**
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

**Response:**
- **Status Code:** 200 OK
- **Body:**
  ```json
  {
    "success": true,
    "data": "550e8400-e29b-41d4-a716-446655440000"
  }
  ```

#### Update Survey

Updates an existing survey.

**Request:**
- **Method:** POST
- **Endpoint:** `/surveys`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <jwt-token>`
- **Body:**
  ```json
  {
    "operation": "create",
    "data": {
      "surveyId": "550e8400-e29b-41d4-a716-446655440000",
      "surveyName": "Customer Satisfaction",
      "min": 1,
      "max": 5,
      "introPrompt": "Please rate your experience",
      "outroPrompt": "Thank you for your feedback",
      "questions": [
        "How satisfied were you with our service?",
        "How likely are you to recommend us?",
        "How would you rate our response time?"
      ],
      "flags": [3, 3, 3]
    }
  }
  ```

**Response:**
- **Status Code:** 200 OK
- **Body:**
  ```json
  {
    "success": true,
    "data": "550e8400-e29b-41d4-a716-446655440000"
  }
  ```

#### Delete Survey

Deletes an existing survey.

**Request:**
- **Method:** POST
- **Endpoint:** `/surveys`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <jwt-token>`
- **Body:**
  ```json
  {
    "operation": "delete",
    "data": {
      "surveyId": "550e8400-e29b-41d4-a716-446655440000"
    }
  }
  ```

**Response:**
- **Status Code:** 200 OK
- **Body:**
  ```json
  {
    "success": true
  }
  ```

### Survey Results

#### Get Survey Results

Retrieves results for a specific survey.

**Request:**
- **Method:** POST
- **Endpoint:** `/results`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <jwt-token>`
- **Body:**
  ```json
  {
    "operation": "results",
    "data": {
      "surveyId": "550e8400-e29b-41d4-a716-446655440000"
    }
  }
  ```

**Response:**
- **Status Code:** 200 OK
- **Body:**
  ```json
  {
    "success": true,
    "data": [
      {
        "contactId": "12345678-1234-1234-1234-123456789012",
        "surveyId": "550e8400-e29b-41d4-a716-446655440000",
        "survey_result_1": "4",
        "survey_result_2": "5",
        "timestamp": 1647532800
      },
      {
        "contactId": "87654321-4321-4321-4321-210987654321",
        "surveyId": "550e8400-e29b-41d4-a716-446655440000",
        "survey_result_1": "3",
        "survey_result_2": "4",
        "timestamp": 1647533800
      }
    ]
  }
  ```

## Error Handling

### Authentication Errors

- **Status Code:** 401 Unauthorized
- **Body:**
  ```json
  {
    "message": "Unauthorized"
  }
  ```

### Validation Errors

- **Status Code:** 400 Bad Request
- **Body:**
  ```json
  {
    "success": false,
    "message": "Unsupported operation"
  }
  ```

### Server Errors

- **Status Code:** 500 Internal Server Error
- **Body:**
  ```json
  {
    "success": false,
    "message": "Something went terribly wrong."
  }
  ```

## API Gateway Configuration

The API Gateway is configured with the following settings:

- **Stage:** `dev`
- **Logging Level:** `ERROR`
- **CORS:** Enabled
- **Authorization:** Cognito User Pools
- **Integration Type:** Lambda Proxy

## Example API Usage

### Using cURL

```bash
# Get JWT token
TOKEN=$(curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"AuthParameters":{"USERNAME":"admin","PASSWORD":"password"},"AuthFlow":"USER_PASSWORD_AUTH","ClientId":"your-client-id"}' \
  https://cognito-idp.us-west-2.amazonaws.com/ | jq -r '.AuthenticationResult.IdToken')

# List surveys
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"operation":"list"}' \
  https://your-api-gateway-id.execute-api.us-west-2.amazonaws.com/dev/surveys
```

### Using JavaScript

```javascript
// Get JWT token
const getToken = async () => {
  const response = await fetch('https://your-cognito-domain.auth.us-west-2.amazoncognito.com/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: 'your-client-id',
      username: 'admin',
      password: 'password'
    })
  });
  const data = await response.json();
  return data.id_token;
};

// List surveys
const listSurveys = async (token) => {
  const response = await fetch('https://your-api-gateway-id.execute-api.us-west-2.amazonaws.com/dev/surveys', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      operation: 'list'
    })
  });
  return await response.json();
};

// Usage
(async () => {
  const token = await getToken();
  const surveys = await listSurveys(token);
  console.log(surveys);
})();
```

## API Limitations

- Maximum request size: 10 MB
- Maximum response size: 10 MB
- Rate limit: 10,000 requests per second
- Timeout: 29 seconds
