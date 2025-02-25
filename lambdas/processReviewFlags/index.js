// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// Import AWS SDK v3 Connect client
const { ConnectClient, StartTaskContactCommand } = require("@aws-sdk/client-connect");
const { v4: uuid } = require("uuid");

// Initialize the Connect client
const connect = new ConnectClient({});

/**
 * Helper method to split a string from the right
 * Used for parsing instance ARN
 * @param {string} sep - Separator to split on
 * @param {number} maxsplit - Maximum number of splits
 * @returns {Array} Array of split string parts
 */
String.prototype.rsplit = function (sep, maxsplit) {
    var split = this.split(sep);
    return maxsplit ? [split.slice(0, -maxsplit).join(sep)].concat(split.slice(-maxsplit)) : split;
};

/**
 * Lambda handler to process survey flags and create tasks for flagged responses
 * @param {Object} event - Event containing survey response details
 * @returns {Object} Response with status code
 */
exports.handler = async (event) => {
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

        try {
            // Create task in Connect using SDK v3
            const command = new StartTaskContactCommand(params);
            await connect.send(command);
        } catch (err) {
            console.log(err);
        }
    }

    // Return success response
    const response = {
        statusCode: 200,
        body: JSON.stringify("OK"),
    };
    return response;
};
