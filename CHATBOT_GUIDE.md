# Chatbot Implementation Guide

## Setup Instructions

### 1. Database Setup

Run the chatbot schema to create the necessary table:

```bash
psql -U postgres -d ccis_vision -f database/chatbot_schema.sql
```

This creates the `chatbot_conversations` table to store conversation history.

### 2. Verify Templates Directory

Ensure the templates directory exists with Excel template files:

```bash
ls backend/templates/
# Should show: template_companies.xlsx, template_activities.xlsx
```

If templates are missing, you can create them manually or use the existing ones from your uploads directory.

### 3. Test the Chatbot API

Start the backend server:

```bash
cd backend
npm run dev
```

### 4. API Testing Examples

#### Send a message to the chatbot:

```bash
curl -X POST http://localhost:5000/api/v1/chatbot/message \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Comment ajouter une entreprise?"}'
```

#### Get conversation history:

```bash
curl http://localhost:5000/api/v1/chatbot/history?limit=10 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get available templates:

```bash
curl http://localhost:5000/api/v1/chatbot/templates \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Download a template:

```bash
curl http://localhost:5000/api/v1/chatbot/templates/companies \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output template_companies.xlsx
```

#### Get help topics:

```bash
curl http://localhost:5000/api/v1/chatbot/help \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get FAQ:

```bash
curl http://localhost:5000/api/v1/chatbot/faq \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Frontend Integration

### Example React Component

```jsx
import { useState } from 'react';
import axios from 'axios';

function Chatbot() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;

    setLoading(true);
    try {
      const response = await axios.post('/api/v1/chatbot/message', 
        { message },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const chatbotResponse = response.data.data.response;
      
      setMessages([
        ...messages,
        { type: 'user', text: message },
        { type: 'bot', data: chatbotResponse }
      ]);
      
      setMessage('');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot">
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={msg.type}>
            {msg.type === 'user' ? msg.text : renderBotResponse(msg.data)}
          </div>
        ))}
      </div>
      
      <input 
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        placeholder="Posez votre question..."
      />
      
      <button onClick={sendMessage} disabled={loading}>
        {loading ? 'Envoi...' : 'Envoyer'}
      </button>
    </div>
  );
}

function renderBotResponse(response) {
  switch(response.type) {
    case 'text':
      return (
        <div>
          <p>{response.message}</p>
          {response.suggestions && (
            <div className="suggestions">
              {response.suggestions.map((s, i) => (
                <button key={i}>{s}</button>
              ))}
            </div>
          )}
        </div>
      );
    
    case 'stats':
      return (
        <div>
          <p>{response.message}</p>
          <ul>
            {Object.entries(response.data).map(([key, value]) => (
              <li key={key}>{key}: {value}</li>
            ))}
          </ul>
        </div>
      );
    
    case 'templates':
      return (
        <div>
          <p>{response.message}</p>
          {response.templates.map((t, i) => (
            <div key={i}>
              <h4>{t.name}</h4>
              <p>{t.description}</p>
              <a href={`/api/v1/chatbot/templates/${t.type}`}>
                Télécharger
              </a>
            </div>
          ))}
        </div>
      );
    
    case 'troubleshooting':
      return (
        <div>
          <p>{response.message}</p>
          {response.solutions.map((sol, i) => (
            <div key={i}>
              <h4>{sol.problem}</h4>
              <ul>
                {sol.solutions.map((s, j) => (
                  <li key={j}>{s}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );
    
    default:
      return <p>{response.message}</p>;
  }
}
```

## Chatbot Features

### 1. Knowledge Base
Pre-configured responses for common questions about:
- Authentication & access
- Company management
- Activity tracking
- Excel import
- Dashboard usage
- Alert management
- Data quality
- Troubleshooting

### 2. Smart Matching
Uses Levenshtein distance algorithm to match similar questions even with typos or variations.

### 3. Context-Aware Suggestions
Provides relevant follow-up suggestions based on the current conversation topic.

### 4. Real-Time Statistics
Queries the database to provide up-to-date statistics about companies, activities, and alerts.

### 5. Template Management
Serves Excel templates for data import with proper formatting and example data.

### 6. Conversation History
Logs all interactions for analytics and continuous improvement.

## Customization

### Add New Knowledge Base Entries

Edit `backend/src/services/chatbotService.js`:

```javascript
this.knowledgeBase = {
  // Add your new entries
  'votre question': 'Votre réponse',
  // ...existing entries
};
```

### Add New Categories

Update the help topics in `backend/src/controllers/chatbotController.js`:

```javascript
{
  category: 'Nouvelle Catégorie',
  questions: [
    'Question 1?',
    'Question 2?'
  ]
}
```

## Troubleshooting

### Chatbot not responding
- Verify backend server is running
- Check authentication token is valid
- Ensure chatbot routes are mounted in routes/index.js

### Template download fails
- Verify templates directory exists: `backend/templates/`
- Check template files exist: `template_companies.xlsx`, `template_activities.xlsx`
- Ensure file permissions allow reading

### Conversation history not saving
- Run the chatbot schema SQL script
- Verify `chatbot_conversations` table exists
- Check database connection

## Analytics

Query conversation logs to understand user needs:

```sql
-- Most common questions
SELECT message, COUNT(*) as count
FROM chatbot_conversations
GROUP BY message
ORDER BY count DESC
LIMIT 10;

-- User engagement
SELECT user_id, COUNT(*) as interactions
FROM chatbot_conversations
GROUP BY user_id
ORDER BY interactions DESC;

-- Response types distribution
SELECT response_type, COUNT(*) as count
FROM chatbot_conversations
GROUP BY response_type;
```
