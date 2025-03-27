# Contact Center Manager Guide

This guide provides detailed instructions for contact center managers using the Amazon Connect Post-Contact Survey Solution.

## Table of Contents

- [Accessing the Survey Management Interface](#accessing-the-survey-management-interface)
- [Creating Surveys](#creating-surveys)
- [Managing Surveys](#managing-surveys)
- [Viewing Survey Results](#viewing-survey-results)
- [Configuring Amazon Connect](#configuring-amazon-connect)
- [Managing Tasks](#managing-tasks)

## Accessing the Survey Management Interface

1. Access the frontend application using the URL provided by your administrator
2. Log in using your credentials
3. The main dashboard displays available surveys and recent results

## Creating Surveys

### Creating a New Survey

1. Navigate to "Surveys" > "Create New Survey"
2. Enter the survey details:
   - Survey Name: A descriptive name for the survey
   - Min/Max Rating: The rating scale (e.g., 1-5)
   - Introduction Prompt: The message played at the start of the survey
   - Conclusion Prompt: The message played at the end of the survey

3. Add questions:
   - Click "Add Question"
   - Enter the question text
   - Set a flag threshold if desired (ratings at or below this value will create tasks)
   - Repeat for additional questions

4. Click "Save Survey"

### Survey Question Best Practices

- Keep questions clear and concise
- Use consistent rating scales
- Limit the number of questions (3-5 is optimal)
- Order questions from general to specific
- Consider the customer's time and patience

### Example Survey

```
Survey Name: Customer Satisfaction
Min Rating: 1
Max Rating: 5
Introduction Prompt: "Thank you for taking our brief survey. Please rate the following on a scale of 1 to 5, where 1 is very dissatisfied and 5 is very satisfied."
Conclusion Prompt: "Thank you for your feedback. We appreciate your business."

Questions:
1. "How satisfied were you with the overall service?" (Flag threshold: 3)
2. "How satisfied were you with the agent's knowledge?" (Flag threshold: 3)
3. "How likely are you to recommend our service?" (Flag threshold: 3)
```

## Managing Surveys

### Editing Surveys

1. Navigate to "Surveys" > "Manage Surveys"
2. Find the survey in the list
3. Click "Edit"
4. Make the necessary changes
5. Click "Save Changes"

### Duplicating Surveys

1. Navigate to "Surveys" > "Manage Surveys"
2. Find the survey in the list
3. Click "Duplicate"
4. Modify the survey as needed
5. Click "Save as New"

### Deleting Surveys

1. Navigate to "Surveys" > "Manage Surveys"
2. Find the survey in the list
3. Click "Delete"
4. Confirm the deletion

## Viewing Survey Results

### Accessing Results

1. Navigate to "Results"
2. Select a survey from the dropdown
3. Set the date range
4. Click "View Results"

### Results Dashboard

The results dashboard displays:

- Overall satisfaction metrics
- Question-by-question breakdown
- Trend analysis over time
- Flagged responses that created tasks

### Exporting Results

1. Navigate to "Results"
2. Select a survey and date range
3. Click "Export"
4. Choose the export format (CSV or Excel)
5. Click "Download"

## Configuring Amazon Connect

### Setting Up Survey Triggers

1. Log in to the Amazon Connect admin console
2. Navigate to "Routing" > "Contact flows"
3. Create or edit a contact flow
4. Add a "Set contact attributes" block to set the `surveyId` attribute:
   - Destination key: `surveyId`
   - Value: The ID of your survey (found in the survey management interface)
5. Add a "Transfer to flow" block
6. Select the "Contact Survey" module
7. Connect the blocks in your flow

### Example Contact Flow Configuration

```
Start
  |
  v
[Set contact attributes]
  | (Set surveyId = "550e8400-e29b-41d4-a716-446655440000")
  v
[Transfer to flow]
  | (Select "Contact Survey" module)
  v
End
```

## Managing Tasks

### Task Creation

Tasks are automatically created when survey responses meet the flag criteria:

1. Customer completes a survey
2. Response is at or below the flag threshold
3. System creates a task in Amazon Connect
4. Task is routed based on your contact flow configuration

### Handling Tasks

1. Log in to the Amazon Connect agent workspace
2. Accept the task
3. Review the survey response details
4. Follow your contact center's procedures for follow-up
5. Complete the task when resolved

### Task Prioritization

Tasks are created with the following attributes:

- Name: "Flagged Post Call Survey"
- Description: Contains the question and response that triggered the flag
- References: Link to the original contact trace record

You can configure your contact flows to prioritize these tasks based on:

- Survey question
- Response value
- Original contact channel
- Agent group

## Best Practices

### Survey Design

- Keep surveys short (3-5 questions)
- Use consistent rating scales
- Ask actionable questions
- Consider the customer journey

### Response Handling

- Follow up on flagged responses promptly
- Look for patterns in responses
- Use feedback to improve agent training
- Close the loop with customers when appropriate

### Continuous Improvement

- Regularly review survey questions
- Adjust flag thresholds based on response patterns
- Compare results across teams and time periods
- Use insights to drive process improvements
