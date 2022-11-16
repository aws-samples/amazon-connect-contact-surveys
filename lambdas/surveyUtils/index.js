// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

exports.handler = async (event) => {
    
    const response = {
        ...event.Details.Parameters
    };
    
    const operation = event.Details.Parameters.operation;
    
    if (!operation) {
        response.success = true;
        response.message = "No operation in input. Nothing to do."
        return response;
    }
    
    switch (operation) {
        case "getNextSurveyQuestion":
            const data = getNextSurveyQuestion();
            response.nextQuestion = data.nextQuestion;
            response.newCounter = data.newCounter;
            response.currentQuestionIndex = data.currentQuestionIndex;
            
            break;
            
        case "validateInput":
            response.validInput = `${validateInput()}`;
            response.message = `Your answer is not between ${event.Details.Parameters.min} and ${event.Details.Parameters.max}.`;
            response.nextQuestion = event.Details.Parameters[`question_${event.Details.ContactData.Attributes.loopCounter}`];
            
            break;
            
        default:
            response.success = false;
            response.message = "Unsupported operation."
    }

    return response;
    
    
    
    
    function validateInput() {
        let min = event.Details.Parameters.min;
        let max = event.Details.Parameters.max;
        
        return parseInt(min) <= parseInt(event.Details.Parameters.input) && parseInt(max) >= parseInt(event.Details.Parameters.input);
    }
    
    function getNextSurveyQuestion() {
        let res = {
            currentQuestionIndex: event.Details.ContactData.Attributes.loopCounter,
            nextQuestion: event.Details.Parameters[`question_${event.Details.ContactData.Attributes.loopCounter}`],
            newCounter: parseInt(event.Details.ContactData.Attributes.loopCounter) + 1
        };
        
        return res;
    }
};
