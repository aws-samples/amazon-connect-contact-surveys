// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
const AWS = require("aws-sdk");
const https = require("https");
const url = require("url");
const client = new AWS.CognitoIdentityServiceProvider();

exports.handler = async (event, context) => {
    if (event.RequestType === "Delete") {
        await send(event, context, "SUCCESS");
        return;
    }

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
        await client.adminUpdateUserAttributes(input).promise();
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

    async function send(event, context, responseStatus, responseData, physicalResourceId, noEcho) {
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

        var parsedUrl = url.parse(event.ResponseURL);
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

        const sendPromise = new Promise((_res, _rej) => {
            try {
                var request = https.request(options, function (response) {
                    console.log("Status code: " + response.statusCode);
                    console.log("Status message: " + response.statusMessage);
                    context.done();
                    _res();
                });

                request.on("error", function (error) {
                    console.log("send(..) failed executing https.request(..): " + error);
                    context.done();
                    _rej();
                });

                request.write(responseBody);
                request.end();
            } catch (e) {
                console.log(e);
            }
        });

        return await sendPromise;
    }
};
