// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB();

exports.handler = async (event) => {
    
    var surveyResults = {};
    var data = event.Details.ContactData.Attributes;
    
    Object.keys(data).forEach(element => {
       if (element.startsWith("survey_result_")) {
           surveyResults[element] = { S: data[element] };
       }
    });
    
    var params = {
        TableName: process.env.TABLE,
        Item: {
            contactId: { S: event.Details.ContactData.ContactId},
            surveyId: { S: event.Details.ContactData.Attributes.surveyId },
            ...surveyResults,
            timestamp: { N: (Date.now() / 1000).toString() }
        }
    }
    
    try {
        await ddb.putItem(params).promise();
    } catch (err) {
        console.log(err);
    }

    const response = {
        statusCode: 200,
        body: JSON.stringify('OK'),
    };
    return response;
};
