// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
const ddb = new AWS.DynamoDB();

const { v4: uuid } = require('uuid');
const OPERATIONS = ['create', 'update', 'list', 'delete', 'results'];


const scanTable = async (tableName) => {
    const params = {
        TableName: tableName,
    };

    const scanResults = [];
    var lastEvaluatuedKey;
    do {
        const items = await docClient.scan(params).promise();
        lastEvaluatuedKey = items.LastEvaluatedKey
        items.Items.forEach((item) => scanResults.push(item));
        params.ExclusiveStartKey = items.LastEvaluatedKey;
    } while (typeof lastEvaluatuedKey !== "undefined");

    return scanResults;

};


exports.handler = async (event) => {

    const response = {
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        }
    };
    
    let operation = undefined;

    if (!validateRequest()) {
        return response;
    }

    let body = {};

    switch (operation) {
        case 'list':

            let data = await listSurveys();

            if (data) {
                response.statusCode = 200;
                body.success = "true";
                body.data = data;
            }
            else {
                response.statusCode = 500;
                body.sucess = false;
                body.message = "Something went terribly wrong."
            }

            response.body = JSON.stringify(body);

            break;

        case 'create':
            let surveyData = JSON.parse(event.body).data;

            if (!surveyData) {
                response.statusCode = 400;
                body.sucess = false;
                body.message = "Unsupported operation."

                response.body = JSON.stringify(body);
            }
            else {

                let questions = {};
                surveyData.questions.forEach((question, index) => {
                    questions[`question_${index + 1}`] = { S: question };
                });

                let flags = {};
                surveyData.flags.forEach((flag, index) => {
                    flags[`flag_question_${index + 1}`] = { N: flag.toString() };
                });
                
                var surveyId = surveyData.surveyId == "" ? uuid() : surveyData.surveyId;

                let item = {
                    TableName: process.env.TABLE_SURVEYS_CONFIG,
                    Item: {
                        surveyId: { S: surveyId },
                        surveyName: { S: surveyData.surveyName },
                        min: { N: surveyData.min.toString() },
                        max: { N: surveyData.max.toString() },
                        introPrompt: { S: surveyData.introPrompt },
                        outroPrompt: { S: surveyData.outroPrompt },
                        ...questions,
                        ...flags
                    }
                };

                surveyData.questions.forEach((question, index) => {
                    item.Item[`question_${index + 1}`] = { S: question };
                });

                let res = await ddb.putItem(item).promise();
                
                response.statusCode = 200;
                body.success = true;
                body.data = surveyId;
                
                response.body = JSON.stringify(body);
                
            }

            break;

        case 'delete':
            var surveyId = JSON.parse(event.body).data.surveyId;
            
            let survey = {
                TableName: process.env.TABLE_SURVEYS_CONFIG,
                Key: {
                    surveyId: { S: surveyId }
                }
            };
            
            let res = await ddb.deleteItem(survey).promise();
            
            break;
            
        case 'results': 

            let queryParams = {
                TableName: process.env.TABLE_SURVEYS_RESULTS,
                FilterExpression: "surveyId = :id",
                ExpressionAttributeValues: {
                    ":id": JSON.parse(event.body).data.surveyId
                }
            }
            
            response.statusCode = 200;
            body.success = true;
            body.data = await getResults(queryParams);
            
            response.body = JSON.stringify(body);

            break;

        default:
            response.statusCode = 400;
            body.sucess = false;
            body.message = "Unsupported operation."

            response.body = JSON.stringify(body);

            break;
    }

    return response;
    
    async function getResults (params) {
        const scanResults = [];
        
        var lastEvaluatuedKey;
        do {
            const items = await docClient.scan(params).promise();
            lastEvaluatuedKey = items.LastEvaluatedKey
            items.Items.forEach((item) => scanResults.push(item));
            params.ExclusiveStartKey = items.LastEvaluatedKey;
        } while (typeof lastEvaluatuedKey !== "undefined");

        return scanResults;

    };

    async function listSurveys() {
        try {
            return await scanTable(process.env.TABLE_SURVEYS_CONFIG);
        }
        catch (e) {
            console.log(e);

            return undefined;
        }
    }

    function validateRequest() {

        if (event.httpMethod === 'POST') {
            try {
                var body = JSON.parse(event.body);
            }
            catch (e) {
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
