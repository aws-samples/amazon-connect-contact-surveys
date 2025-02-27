// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * Lambda handler for survey utility functions
 * Supports operations for managing survey flow and input validation
 * 
 * @param {Object} event - Event from Amazon Connect containing operation and parameters
 * @returns {Object} Response object with operation-specific data
 */
exports.handler = async (event) => {
    // Initialize response with all parameters from the event
    const response = {
        ...event.Details.Parameters
    };
    
    const operation = event.Details.Parameters.operation;
    
    // If no operation specified, return early with success
    if (!operation) {
        response.success = true;
        response.message = "No operation in input. Nothing to do.";
        return response;
    }
    
    // Process different operations
    switch (operation) {
        case "getNextSurveyQuestion":
            // Get next question in the survey sequence
            const data = getNextSurveyQuestion();
            response.nextQuestion = data.nextQuestion;
            response.newCounter = data.newCounter;
            response.currentQuestionIndex = data.currentQuestionIndex;
            break;
            
        case "validateInput":
            // Validate user input against min/max bounds
            response.validInput = `${validateInput()}`;
            response.message = `Your answer is not between ${event.Details.Parameters.min} and ${event.Details.Parameters.max}.`;
            response.nextQuestion = event.Details.Parameters[`question_${event.Details.ContactData.Attributes.loopCounter}`];
            break;
            
        default:
            // Handle unsupported operations
            response.success = false;
            response.message = "Unsupported operation.";
    }

    return response;
    
    /**
     * Validates if the user input falls within the specified min/max bounds
     * @returns {boolean} True if input is valid, false otherwise
     */
    function validateInput() {
        let min = event.Details.Parameters.min;
        let max = event.Details.Parameters.max;
        
        return parseInt(min) <= parseInt(event.Details.Parameters.input) && 
               parseInt(max) >= parseInt(event.Details.Parameters.input);
    }
    
    /**
     * Gets the next survey question and updates the question counter
     * @returns {Object} Object containing next question details and updated counter
     */
    function getNextSurveyQuestion() {
        let res = {
            currentQuestionIndex: event.Details.ContactData.Attributes.loopCounter,
            nextQuestion: event.Details.Parameters[`question_${event.Details.ContactData.Attributes.loopCounter}`],
            newCounter: parseInt(event.Details.ContactData.Attributes.loopCounter) + 1
        };
        
        return res;
    }
};
