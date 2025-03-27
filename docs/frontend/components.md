# Frontend Components

This document provides detailed information about the React components used in the Amazon Connect Post-Contact Survey Solution.

## Component Hierarchy

```
App
├── Authentication
│   ├── Login
│   ├── ForgotPassword
│   └── ChangePassword
├── Home
│   └── Dashboard
├── SurveysList
│   ├── SurveyItem
│   └── SurveyFilter
├── Survey
│   ├── SurveyForm
│   ├── QuestionEditor
│   └── FlagThresholdEditor
└── SurveyResults
    ├── ResultsTable
    ├── ResultsChart
    └── ResultsExport
```

## Authentication Components

### Login Component

The Login component handles user authentication through Amazon Cognito.

**Props:**
- `onLogin`: Function to call after successful login

**State:**
- `username`: String containing the username
- `password`: String containing the password
- `error`: Error message if authentication fails

**Methods:**
- `handleSubmit`: Handles form submission
- `validateForm`: Validates form inputs

**Example Usage:**
```jsx
<Login onLogin={() => navigate('/dashboard')} />
```

### ForgotPassword Component

Handles password recovery through Amazon Cognito.

**Props:**
- `onSuccess`: Function to call after successful password reset

**State:**
- `username`: String containing the username
- `verificationCode`: String containing the verification code
- `newPassword`: String containing the new password
- `step`: Current step in the password reset flow

**Methods:**
- `requestCode`: Requests a verification code
- `resetPassword`: Resets the password with the verification code

**Example Usage:**
```jsx
<ForgotPassword onSuccess={() => navigate('/login')} />
```

### ChangePassword Component

Allows authenticated users to change their password.

**Props:**
- `onSuccess`: Function to call after successful password change

**State:**
- `currentPassword`: String containing the current password
- `newPassword`: String containing the new password
- `confirmPassword`: String containing the password confirmation

**Methods:**
- `changePassword`: Changes the user's password

**Example Usage:**
```jsx
<ChangePassword onSuccess={() => setShowSuccessMessage(true)} />
```

## Survey Management Components

### SurveysList Component

Displays a list of available surveys.

**Props:**
- `onSelectSurvey`: Function to call when a survey is selected

**State:**
- `surveys`: Array of survey objects
- `loading`: Boolean indicating if surveys are being loaded
- `error`: Error message if loading fails

**Methods:**
- `fetchSurveys`: Fetches surveys from the API
- `deleteSurvey`: Deletes a survey

**Example Usage:**
```jsx
<SurveysList onSelectSurvey={(survey) => setSelectedSurvey(survey)} />
```

### Survey Component

Manages the creation and editing of surveys.

**Props:**
- `survey`: Survey object to edit (optional)
- `onSave`: Function to call after saving the survey

**State:**
- `surveyData`: Object containing survey data
- `errors`: Object containing validation errors
- `saving`: Boolean indicating if the survey is being saved

**Methods:**
- `handleSubmit`: Handles form submission
- `addQuestion`: Adds a new question
- `removeQuestion`: Removes a question
- `updateQuestion`: Updates a question
- `updateFlag`: Updates a flag threshold

**Example Usage:**
```jsx
<Survey survey={selectedSurvey} onSave={() => fetchSurveys()} />
```

### QuestionEditor Component

Edits individual survey questions.

**Props:**
- `question`: Question text
- `index`: Question index
- `onChange`: Function to call when the question changes
- `onRemove`: Function to call when the question is removed

**State:**
- `text`: Question text

**Methods:**
- `handleChange`: Handles text input changes

**Example Usage:**
```jsx
<QuestionEditor
  question="How satisfied were you with our service?"
  index={0}
  onChange={(text) => updateQuestion(0, text)}
  onRemove={() => removeQuestion(0)}
/>
```

### FlagThresholdEditor Component

Edits flag thresholds for survey questions.

**Props:**
- `threshold`: Current threshold value
- `index`: Question index
- `min`: Minimum possible value
- `max`: Maximum possible value
- `onChange`: Function to call when the threshold changes

**State:**
- `value`: Threshold value

**Methods:**
- `handleChange`: Handles value changes

**Example Usage:**
```jsx
<FlagThresholdEditor
  threshold={3}
  index={0}
  min={1}
  max={5}
  onChange={(value) => updateFlag(0, value)}
/>
```

## Results Components

### SurveyResults Component

Displays survey results.

**Props:**
- `surveyId`: ID of the survey to display results for

**State:**
- `results`: Array of result objects
- `loading`: Boolean indicating if results are being loaded
- `error`: Error message if loading fails

**Methods:**
- `fetchResults`: Fetches results from the API
- `exportResults`: Exports results to CSV

**Example Usage:**
```jsx
<SurveyResults surveyId="customer-satisfaction-1" />
```

### ResultsTable Component

Displays survey results in a table format.

**Props:**
- `results`: Array of result objects
- `questions`: Array of question texts

**Example Usage:**
```jsx
<ResultsTable results={surveyResults} questions={surveyQuestions} />
```

### ResultsChart Component

Displays survey results in a chart format.

**Props:**
- `results`: Array of result objects
- `questions`: Array of question texts
- `chartType`: Type of chart to display

**Example Usage:**
```jsx
<ResultsChart
  results={surveyResults}
  questions={surveyQuestions}
  chartType="bar"
/>
```

## Utility Components

### ErrorBoundary Component

Catches JavaScript errors in child components.

**Props:**
- `children`: Child components
- `fallback`: Component to display when an error occurs

**State:**
- `hasError`: Boolean indicating if an error has occurred
- `error`: Error object

**Methods:**
- `componentDidCatch`: Catches errors in child components

**Example Usage:**
```jsx
<ErrorBoundary fallback={<ErrorPage />}>
  <SurveyForm />
</ErrorBoundary>
```

### LoadingSpinner Component

Displays a loading spinner.

**Props:**
- `size`: Size of the spinner
- `message`: Message to display

**Example Usage:**
```jsx
<LoadingSpinner size="large" message="Loading surveys..." />
```

### Pagination Component

Handles pagination for lists.

**Props:**
- `currentPage`: Current page number
- `totalPages`: Total number of pages
- `onPageChange`: Function to call when the page changes

**Example Usage:**
```jsx
<Pagination
  currentPage={1}
  totalPages={5}
  onPageChange={(page) => setCurrentPage(page)}
/>
```
