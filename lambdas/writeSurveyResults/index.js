// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// Import AWS SDK v3 DynamoDB clients
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize DynamoDB clients
const client = new DynamoDBClient({});
// Create document client with default marshalling options
const docClient = DynamoDBDocumentClient.from(client);

/**
 * Lambda handler to store survey results in DynamoDB
 * Processes survey responses from Amazon Connect contact flow
 * 
 * @param {Object} event - Event containing survey responses and contact details
 * @returns {Object} Response indicating success/failure of the operation
 */
exports.handler = async (event) => {
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
    
    try {
        // Write survey results to DynamoDB
        const command = new PutCommand(params);
        await docClient.send(command);
    } catch (err) {
        // Log any errors that occur during write operation
        console.log(err);
    }

    // Return success response
    const response = {
        statusCode: 200,
        body: JSON.stringify('OK'),
    };
    return response;
};
