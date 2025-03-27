# Data Flow Diagrams

This document provides detailed data flow diagrams for the key processes in the Amazon Connect Post-Contact Survey Solution.

## Survey Creation Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │     │             │
│    Admin    │────►│  Frontend   │────►│ API Gateway │────►│ Lambda API  │
│             │     │             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └──────┬──────┘
                                                                   │
                                                                   ▼
                                                           ┌─────────────┐
                                                           │             │
                                                           │  DynamoDB   │
                                                           │  Config     │
                                                           │             │
                                                           └─────────────┘
```

1. Admin creates or updates a survey through the frontend interface
2. Frontend sends a request to API Gateway
3. API Gateway routes the request to the Lambda API function
4. Lambda API function stores the survey configuration in DynamoDB

## Survey Execution Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │     │             │
│  Contact    │────►│  Connect    │────►│ Contact Flow│────►│ GetSurvey   │
│  Ends       │     │  Instance   │     │ Module      │     │ Config      │
│             │     │             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └──────┬──────┘
                                                                   │
                                                                   ▼
                                                           ┌─────────────┐
                                                           │             │
                                                           │  DynamoDB   │
                                                           │  Config     │
                                                           │             │
                                                           └──────┬──────┘
                                                                  │
                                                                  ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │     │             │
│  Customer   │◄────│  Survey     │◄────│ Survey      │◄────│ Survey      │
│             │     │  Questions  │     │ Utils       │     │ Config      │
│             │     │             │     │             │     │             │
└──────┬──────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│  Customer   │────►│ Write Survey│────►│  DynamoDB   │
│  Responses  │     │ Results     │     │  Results    │
│             │     │             │     │             │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                           ▼
                   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
                   │             │     │             │     │             │
                   │ Process     │────►│ Create      │────►│ Connect     │
                   │ Survey Flags│     │ Task        │     │ Task        │
                   │             │     │             │     │             │
                   └─────────────┘     └─────────────┘     └─────────────┘
```

1. Contact ends in Amazon Connect
2. Contact Flow Module is triggered to start the survey
3. GetSurveyConfig Lambda retrieves survey configuration from DynamoDB
4. Survey questions are presented to the customer
5. Customer responses are collected
6. WriteSurveyResults Lambda stores responses in DynamoDB
7. ProcessSurveyFlags Lambda evaluates responses against thresholds
8. Tasks are created in Amazon Connect for flagged responses

## Survey Results Retrieval Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │     │             │
│    Admin    │────►│  Frontend   │────►│ API Gateway │────►│ Lambda API  │
│             │     │             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └──────┬──────┘
                                                                   │
                                                                   ▼
                                                           ┌─────────────┐
                                                           │             │
                                                           │  DynamoDB   │
                                                           │  Results    │
                                                           │             │
                                                           └──────┬──────┘
                                                                  │
                                                                  ▼
                                                           ┌─────────────┐
                                                           │             │
                                                           │  Frontend   │
                                                           │  Display    │
                                                           │             │
                                                           └─────────────┘
```

1. Admin requests survey results through the frontend interface
2. Frontend sends a request to API Gateway
3. API Gateway routes the request to the Lambda API function
4. Lambda API function retrieves survey results from DynamoDB
5. Results are displayed in the frontend interface

## Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│    User     │────►│  Frontend   │────►│  Cognito    │
│             │     │             │     │  User Pool  │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │             │
                                        │  JWT Token  │
                                        │             │
                                        └──────┬──────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│  Protected  │◄────│ API Gateway │◄────│  Token      │
│  Resources  │     │ Authorizer  │     │  Validation │
│             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

1. User logs in through the frontend interface
2. Frontend authenticates with Cognito User Pool
3. Cognito returns a JWT token
4. Token is included in API requests
5. API Gateway Authorizer validates the token
6. User accesses protected resources
