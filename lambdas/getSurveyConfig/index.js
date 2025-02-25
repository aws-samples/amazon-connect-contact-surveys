// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// Import AWS SDK v3 DynamoDB clients
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize the DynamoDB client
const client = new DynamoDBClient({});
// Create a document client with marshalling enabled
const docClient = DynamoDBDocumentClient.from(client);

/**
 * Lambda handler to retrieve survey configuration from DynamoDB
 * Used by Amazon Connect to fetch survey details during contact flows
 * 
 * @param {Object} event - Lambda event containing survey parameters
 * @returns {Object} Survey configuration including questions and metadata
 */
exports.handler = async (event) => {
    // Initialize response object
    const response = {};

    // Prepare DynamoDB query parameters
    const params = {
        TableName: process.env.TABLE,
        Key: {
            'surveyId': event.Details.Parameters.surveyId
        }
    };
    
    try {
        // Fetch survey configuration from DynamoDB
        const command = new GetCommand(params);
        const result = await docClient.send(command);
        
        response.statusCode = 200;
        
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
        
    } catch (err) {
        // Log any errors that occur during execution
        console.log(err);
    }
    
    return response;
};
