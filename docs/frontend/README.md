# Frontend Documentation

The frontend of the Amazon Connect Post-Contact Survey Solution is built using React.js and provides a user interface for managing surveys and viewing results.

## Component Structure

```
src/
├── components/
│   ├── Authentication/       # Authentication components
│   ├── ChangePassword/       # Password management
│   ├── ForgotPassword/       # Password recovery
│   ├── Home/                 # Dashboard component
│   ├── Logout/              # Logout handling
│   ├── Survey/              # Survey management
│   └── SurveysList/         # Survey listing
├── models/
│   └── SurveyModel.tsx      # Survey data model
├── App.tsx                  # Main application component
└── index.tsx               # Application entry point
```

## Key Components

### Authentication Components
- Login form
- Password management
- Session handling
- Protected route implementation

### Survey Management Components
- Survey creation and editing
- Question configuration
- Response threshold settings
- Results viewing

### Data Models

```typescript
export interface SurveyModel {
    surveyId: string;
    surveyName: string;
    max: number;
    min: number;
    introPrompt: string;
    outroPrompt: string;
    questions: string[];
    flags: number[];
}
```

## State Management

The application uses React's built-in state management with hooks:

```typescript
// Example state management in a component
const [surveys, setSurveys] = useState<SurveyModel[]>([]);
const [loading, setLoading] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);
```

## API Integration

### Survey Creation
```typescript
const createSurvey = async (survey: SurveyModel) => {
  const response = await axios.post('/api/surveys', {
    operation: 'create',
    survey: survey
  });
  return response.data;
};
```

### Survey Results Processing
```typescript
const processSurveyResponse = async (response) => {
  await axios.post('/api/surveys/results', {
    surveyId: response.surveyId,
    contactId: response.contactId,
    responses: response.answers
  });
};
```

## Authentication Flow

1. User enters credentials
2. Cognito authentication
3. JWT token storage
4. Protected route access

```typescript
// Example protected route
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};
```

## Error Handling

```typescript
try {
  const result = await createSurvey(surveyData);
  // Handle success
} catch (error) {
  if (error.response) {
    // Handle API error
    setError(error.response.data.message);
  } else {
    // Handle network error
    setError('Network error occurred');
  }
}
```

## Component Examples

### Survey Form
```typescript
const SurveyForm = () => {
  const [survey, setSurvey] = useState<SurveyModel>({
    surveyId: '',
    surveyName: '',
    max: 5,
    min: 1,
    introPrompt: '',
    outroPrompt: '',
    questions: [],
    flags: []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSurvey(survey);
      // Handle success
    } catch (error) {
      // Handle error
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
};
```

### Survey List
```typescript
const SurveyList = () => {
  const [surveys, setSurveys] = useState<SurveyModel[]>([]);

  useEffect(() => {
    const fetchSurveys = async () => {
      const response = await axios.get('/api/surveys');
      setSurveys(response.data);
    };
    fetchSurveys();
  }, []);

  return (
    <div>
      {surveys.map(survey => (
        <SurveyItem key={survey.surveyId} survey={survey} />
      ))}
    </div>
  );
};
```

## Styling

The application uses CSS modules for styling:

```css
/* App.css */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.surveyForm {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
```

## Build and Deployment

The frontend is built using Create React App and deployed to S3:

```bash
# Build the application
npm run build

# Deploy to S3
aws s3 sync build/ s3://your-bucket-name
```

## Testing

```typescript
// Example test
import { render, screen } from '@testing-library/react';
import SurveyForm from './SurveyForm';

test('renders survey form', () => {
  render(<SurveyForm />);
  expect(screen.getByText('Create Survey')).toBeInTheDocument();
});
```

## Performance Considerations

- Lazy loading of components
- Memoization of expensive computations
- Efficient re-rendering strategies
- API request caching

## Accessibility

- ARIA labels
- Keyboard navigation
- Color contrast
- Screen reader support

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Polyfills for older browsers
- Responsive design for mobile devices
