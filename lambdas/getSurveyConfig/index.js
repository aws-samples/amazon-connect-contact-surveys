// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB();

exports.handler = async (event) => {

    const response = {};

    var params = {
        TableName: process.env.TABLE,
        Key: {
            'surveyId': { S: event.Details.Parameters.surveyId }
        }
    };
    
    try {
        let res = await ddb.getItem(params).promise();
        response.statusCode = 200;
        
        if (res.Item) {
            response.message = 'OK';
            
            let size = 0;
            Object.keys(res.Item).forEach(k => {
                if (res.Item[k].S) {
                    response[k] = res.Item[k].S;
                }
                
                if (res.Item[k].N) {
                    response[k] = res.Item[k].N;
                }
                
                size = k.startsWith('question') ? size + 1 : size;
            });
            
            response.surveySize = size;
        } else {
            response.message = `Couldn't find configuration for survey with id [${event.Details.Parameters.surveyId}]`;
        }
        
    } catch (err) {
        console.log(err);
    }
    
    return response;
};
