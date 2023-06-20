// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const AWS = require('aws-sdk');
const connect = new AWS.Connect();

const { v4: uuid } = require('uuid');

String.prototype.rsplit = function(sep, maxsplit) {
    var split = this.split(sep);
    return maxsplit ? [split.slice(0, -maxsplit).join(sep)].concat(split.slice(-maxsplit)) : split;
};

exports.handler = async (event) => {

    let flagged = {};
    let surveyKeys = Object.keys(event.Details.ContactData.Attributes).filter(o => o.startsWith("survey_result_"));
    surveyKeys.sort();
    
    surveyKeys.forEach((key, index) => {
        console.log(`Processing ${key}`);
        if (event.Details.Parameters[`flag_question_${index + 1}`] && event.Details.Parameters[`flag_question_${index + 1}`] != '') {
            console.log(`Flag exists for ${key} with threshold ${event.Details.Parameters[`flag_question_${index + 1}`]}`);
            if (parseInt(event.Details.ContactData.Attributes[key]) <= parseInt(event.Details.Parameters[`flag_question_${index + 1}`])) {
                flagged[key] = event.Details.Parameters[`flag_question_${index + 1}`];
            }
        }
    });

    if (Object.keys(flagged).length > 0) {

        let instanceId = event['Details']['ContactData']['InstanceARN'].rsplit("/", 1)[1];
        let description = "";
        
        Object.keys(flagged).forEach(key => {
            description += `Question ${key.substr(key.length - 1)}: ${flagged[key]}\n`;
        });
        
        var params = {
            ContactFlowId: process.env.CONTACT_FLOW_ID,
            InstanceId: instanceId,
            Name: 'Flagged Post Call Survey',
            Attributes: {
                'surveyId': event['Details']['ContactData']['Attributes']['surveyId'],
                'contactId': event['Details']['ContactData']['ContactId'],
            },
            ClientToken: uuid(),
            Description: description,
            References: {
                'CTR': {
                    Type: 'URL',
                    Value: `https://${process.env.INSTANCE_NAME}.my.connect.aws/contact-trace-records/details/${event['Details']['ContactData']['ContactId']}`
                },
            },
        };
        
        try {
            let res = await connect.startTaskContact(params).promise();
        } catch (err) {
            console.log(err);
        }
        
    }

    // TODO implement
    const response = {
        statusCode: 200,
        body: JSON.stringify('OK'),
    };
    return response;
};
