// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// Import AWS SDK v3 Cognito Identity Provider client
const { 
    CognitoIdentityProviderClient, 
    AdminUpdateUserAttributesCommand 
} = require("@aws-sdk/client-cognito-identity-provider");
const https = require("https");
const url = require("url");

// Initialize Cognito Identity Provider client
const client = new CognitoIdentityProviderClient({});

/**
 * Lambda handler for Custom Resource to validate Cognito user
 * This function is typically called by CloudFormation during stack operations
 * 
 * @param {Object} event - CloudFormation Custom Resource event
 * @param {Object} context - Lambda context object
 * @returns {Object} Response object with status code and empty body
 */
exports.handler = async (event, context) => {
    // Handle stack deletion - return success immediately
    if (event.RequestType === "Delete") {
        await send(event, context, "SUCCESS");
        return;
    }

    // Prepare input for updating user attributes
    const input = {
        UserPoolId: event.ResourceProperties.UserPoolId,
        Username: "admin",
        UserAttributes: [
            {
                Name: "email_verified",
                Value: "true",
            },
        ],
    };

    try {
        // Update admin user attributes to verify email
        const command = new AdminUpdateUserAttributesCommand(input);
        await client.send(command);
    } catch (e) {
        console.log(e);
        await send(event, context, "FAILED");
    }

    const response = {
        statusCode: 200,
        body: JSON.stringify({}),
    };

    await send(event, context, "SUCCESS");

    return response;
};

/**
 * Sends response back to CloudFormation
 * This is required for Custom Resources to signal completion to CloudFormation
 * 
 * @param {Object} event - CloudFormation Custom Resource event
 * @param {Object} context - Lambda context object
 * @param {string} responseStatus - Status of the operation (SUCCESS/FAILED)
 * @param {Object} responseData - Additional data to send back to CloudFormation
 * @param {string} physicalResourceId - Physical ID of the custom resource
 * @param {boolean} noEcho - Whether to mask the response in CloudFormation logs
 * @returns {Promise} Promise that resolves when the response is sent
 */
async function send(event, context, responseStatus, responseData, physicalResourceId, noEcho) {
    // Prepare the response body for CloudFormation
    var responseBody = JSON.stringify({
        Status: responseStatus,
        Reason: "See the details in CloudWatch Log Stream: " + context.logStreamName,
        PhysicalResourceId: physicalResourceId || context.logStreamName,
        StackId: event.StackId,
        RequestId: event.RequestId,
        LogicalResourceId: event.LogicalResourceId,
        NoEcho: noEcho || false,
        Data: responseData,
    });

    console.log("Response body:\n", responseBody);

    // Parse the pre-signed URL provided by CloudFormation
    var parsedUrl = url.parse(event.ResponseURL);
    
    // Prepare the HTTPS request options
    var options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.path,
        method: "PUT",
        headers: {
            "content-type": "",
            "content-length": responseBody.length,
        },
    };

    // Create a promise to handle the HTTPS request
    const sendPromise = new Promise((_res, _rej) => {
        try {
            // Send the HTTPS request to CloudFormation
            var request = https.request(options, function (response) {
                console.log("Status code: " + response.statusCode);
                console.log("Status message: " + response.statusMessage);
                context.done();
                _res();
            });

            // Handle any errors in the HTTPS request
            request.on("error", function (error) {
                console.log("send(..) failed executing https.request(..): " + error);
                context.done();
                _rej();
            });

            // Send the response body
            request.write(responseBody);
            request.end();
        } catch (e) {
            console.log(e);
        }
    });

    return await sendPromise;
}
