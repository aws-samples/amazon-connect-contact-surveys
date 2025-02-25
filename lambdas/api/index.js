// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// Import AWS SDK v3 DynamoDB clients
// DynamoDBClient is the low-level client
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
// DynamoDBDocumentClient provides a higher-level abstraction for working with data
const { 
    DynamoDBDocumentClient, 
    ScanCommand, 
    PutCommand, 
    DeleteCommand 
} = require('@aws-sdk/lib-dynamodb');
// UUID v4 for generating unique identifiers
const { v4: uuid } = require('uuid');

// Initialize DynamoDB clients
const client = new DynamoDBClient({});
// Create document client with default marshalling options
const docClient = DynamoDBDocumentClient.from(client);

// Define valid operations for the API
const OPERATIONS = ['create', 'update', 'list', 'delete', 'results'];

/**
 * Scans an entire DynamoDB table and returns all items
 * Handles pagination automatically using LastEvaluatedKey
 * @param {string} tableName - The name of the DynamoDB table to scan
 * @returns {Array} Array of items from the table
 */
const scanTable = async (tableName) => {
    const params = {
        TableName: tableName,
    };

    const scanResults = [];
    let lastEvaluatedKey;
    
    do {
        const command = new ScanCommand(params);
        const response = await docClient.send(command);
        lastEvaluatedKey = response.LastEvaluatedKey;
        scanResults.push(...(response.Items || []));
        params.ExclusiveStartKey = lastEvaluatedKey;
    } while (lastEvaluatedKey);

    return scanResults;
};

/**
 * Lambda handler function - processes API requests for survey operations
 * @param {Object} event - AWS Lambda event object
 * @returns {Object} Response object with status code and body
 */
exports.handler = async (event) => {
    // Initialize response object with CORS headers
    const response = {
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        }
    };
    
    let operation = undefined;

    // Validate incoming request
    if (!validateRequest()) {
        return response;
    }

    let body = {};

    // Process request based on operation type
    switch (operation) {
        case 'list':
            // Retrieve all surveys from the configuration table
            let data = await listSurveys();

            if (data) {
                response.statusCode = 200;
                body.success = "true";
                body.data = data;
            } else {
                response.statusCode = 500;
                body.success = false;
                body.message = "Something went terribly wrong.";
            }

            response.body = JSON.stringify(body);
            break;

        case 'create':
            // Create or update a survey configuration
            let surveyData = JSON.parse(event.body).data;

            if (!surveyData) {
                response.statusCode = 400;
                body.success = false;
                body.message = "Unsupported operation.";
                response.body = JSON.stringify(body);
            } else {
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
                
                response.statusCode = 200;
                body.success = true;
                body.data = surveyId;
                response.body = JSON.stringify(body);
            }
            break;

        case 'delete':
            // Delete a survey configuration
            const surveyIdToDelete = JSON.parse(event.body).data.surveyId;
            
            const deleteCommand = new DeleteCommand({
                TableName: process.env.TABLE_SURVEYS_CONFIG,
                Key: {
                    surveyId: surveyIdToDelete
                }
            });
            
            await docClient.send(deleteCommand);
            
            response.statusCode = 200;
            body.success = true;
            response.body = JSON.stringify(body);
            break;
            
        case 'results': 
            // Retrieve survey results for a specific survey
            const scanCommand = new ScanCommand({
                TableName: process.env.TABLE_SURVEYS_RESULTS,
                FilterExpression: "surveyId = :id",
                ExpressionAttributeValues: {
                    ":id": JSON.parse(event.body).data.surveyId
                }
            });
            
            const results = await getResults(scanCommand);
            response.statusCode = 200;
            body.success = true;
            body.data = results;
            response.body = JSON.stringify(body);
            break;

        default:
            response.statusCode = 400;
            body.success = false;
            body.message = "Unsupported operation.";
            response.body = JSON.stringify(body);
            break;
    }

    return response;
    
    /**
     * Retrieves all results for a specific survey
     * Handles pagination for large result sets
     * @param {ScanCommand} scanCommand - Prepared scan command for DynamoDB
     * @returns {Array} Array of survey results
     */
    async function getResults(scanCommand) {
        const scanResults = [];
        let lastEvaluatedKey;
        
        do {
            const response = await docClient.send(scanCommand);
            lastEvaluatedKey = response.LastEvaluatedKey;
            scanResults.push(...(response.Items || []));
            if (lastEvaluatedKey) {
                scanCommand.input.ExclusiveStartKey = lastEvaluatedKey;
            }
        } while (lastEvaluatedKey);

        return scanResults;
    }

    /**
     * Retrieves all survey configurations
     * @returns {Array|undefined} Array of survey configurations or undefined on error
     */
    async function listSurveys() {
        try {
            return await scanTable(process.env.TABLE_SURVEYS_CONFIG);
        } catch (e) {
            console.log(e);
            return undefined;
        }
    }

    /**
     * Validates the incoming request
     * Checks for valid JSON body and operation type
     * @returns {boolean} True if request is valid, false otherwise
     */
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
};
