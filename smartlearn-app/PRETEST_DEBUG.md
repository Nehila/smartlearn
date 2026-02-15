# Pre-test AI Questions Debug Guide

## What Was Changed

The Pre-test page now generates personalized questions using AI after Step 1.

### Flow:
1. **Step 1**: User enters Topic and Level (static questions)
2. **Click Next**: 
   - Page moves to Step 2
   - Shows loading state with spinner
   - Calls OpenAI to generate 8-10 personalized questions
3. **Steps 2-4**: Display AI-generated questions (split across 3 steps)
4. **Step 5**: Review and generate final learning path

## How to Debug

### 1. Check Browser Console

Open browser DevTools (F12) and look for:

```javascript
// When questions are generated:
"AI Questions generated:" [array of questions]

// When rendering:
"Rendering step X Total questions: Y Current questions: Z"
```

### 2. Check OpenAI API Key

Make sure `.env` file has:
```
NEXT_PUBLIC_OPENAI_API_KEY=sk-your-key-here
```

**Important**: The key MUST start with `NEXT_PUBLIC_` to be available in the browser.

### 3. Test the OpenAI Hook

Create a test file to verify the hook works:

```typescript
// Test in browser console or create a test component
const { generate } = useOpenAI()

const test = await generate({
  prompt: "Say hello",
  schema: {
    properties: {
      message: { type: "string" }
    },
    required: ["message"]
  }
})

console.log(test)
```

### 4. Check Network Tab

In DevTools Network tab, look for:
- Request to `https://api.openai.com/v1/chat/completions`
- Status should be 200
- Response should contain generated questions

### 5. Common Issues

#### No Questions Generated
- **Check**: API key is set correctly
- **Check**: API key has `NEXT_PUBLIC_` prefix
- **Check**: OpenAI API has credits/not rate limited
- **Check**: Browser console for errors

#### Questions Not Showing
- **Check**: `aiQuestions` state in React DevTools
- **Check**: Console logs show questions array
- **Check**: `loadingQuestions` state is false after generation

#### Loading Forever
- **Check**: Network request completed
- **Check**: No errors in console
- **Check**: `setLoadingQuestions(false)` is being called

## Testing Steps

1. **Start the dev server**:
   ```bash
   cd smartlearn-app
   npm run dev
   ```

2. **Open browser**: http://localhost:3000/pre-test

3. **Fill Step 1**:
   - Topic: "React"
   - Level: "Beginner"

4. **Click Next**:
   - Should show loading spinner
   - Check console for logs
   - Wait 3-5 seconds

5. **Verify Step 2**:
   - Should show 3-4 questions
   - Questions should be about React
   - Questions should have inputs/selects

## Expected Console Output

```
AI Questions generated: [
  {
    id: "q1",
    question: "What is your main goal for learning React?",
    type: "select",
    options: ["Build a career", "Personal project", "Improve skills", "Other"]
  },
  // ... more questions
]

Rendering step 2 Total questions: 9 Current questions: 3
```

## If Still Not Working

1. **Check API Response**:
   - Open Network tab
   - Find the OpenAI request
   - Check response body
   - Verify it has `questions` array

2. **Simplify the Schema**:
   Try with a simpler schema first:
   ```typescript
   schema: {
     properties: {
       questions: {
         type: "array",
         items: {
           type: "object",
           properties: {
             id: { type: "string" },
             question: { type: "string" },
             type: { type: "string" }
           },
           required: ["id", "question", "type"],
           additionalProperties: false
         }
       }
     },
     required: ["questions"]
   }
   ```

3. **Add More Logging**:
   Add console.logs in the component:
   ```typescript
   console.log("Step:", step)
   console.log("Loading:", loadingQuestions)
   console.log("Questions:", aiQuestions)
   console.log("Form data:", formData)
   ```

## Contact

If issues persist, check:
- OpenAI API status: https://status.openai.com/
- API key permissions and credits
- Browser console for detailed error messages
