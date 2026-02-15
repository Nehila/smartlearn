# useOpenAI Hook

A React hook for working with OpenAI's GPT-4o-mini model with JSON Schema support for structured responses.

## Features

- ✅ Type-safe responses with TypeScript
- ✅ JSON Schema validation
- ✅ Built-in loading and error states
- ✅ Easy to use API
- ✅ Supports custom system prompts
- ✅ Configurable model and API key

## Setup

1. Add your OpenAI API key to `.env.local`:

```bash
NEXT_PUBLIC_OPENAI_API_KEY=sk-your-api-key-here
```

2. Import and use the hook in your component:

```tsx
import { useOpenAI } from "@/hooks/use-openai"
```

## Basic Usage

```tsx
function MyComponent() {
  const { generate, isLoading, error, data } = useOpenAI()

  const handleGenerate = async () => {
    const result = await generate({
      prompt: "Generate a list of 5 programming languages",
      schema: {
        properties: {
          languages: {
            type: "array",
            items: {
              type: "string"
            }
          }
        },
        required: ["languages"]
      }
    })

    if (result.data) {
      console.log(result.data.languages)
    }
  }

  return (
    <button onClick={handleGenerate} disabled={isLoading}>
      {isLoading ? "Generating..." : "Generate"}
    </button>
  )
}
```

## API Reference

### `useOpenAI(options?)`

#### Options

- `apiKey?: string` - OpenAI API key (defaults to `NEXT_PUBLIC_OPENAI_API_KEY`)
- `model?: string` - Model to use (defaults to `"gpt-4o-mini"`)

#### Returns

- `generate<T>(request)` - Function to generate a response
- `isLoading: boolean` - Loading state
- `error: string | null` - Error message if any
- `data: T | null` - Generated data
- `reset()` - Reset the hook state

### `generate(request)`

#### Request Parameters

- `prompt: string` - The prompt to send to OpenAI
- `schema: object` - JSON Schema for the response structure
- `systemPrompt?: string` - Custom system prompt (optional)

#### Returns

Promise that resolves to:

```typescript
{
  data: T | null
  error: string | null
  isLoading: boolean
}
```

## JSON Schema Examples

### Simple Object

```typescript
{
  properties: {
    name: { type: "string" },
    age: { type: "number" },
    email: { type: "string" }
  },
  required: ["name", "age", "email"]
}
```

### Array of Objects

```typescript
{
  properties: {
    users: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          role: { type: "string" }
        },
        required: ["name", "role"],
        additionalProperties: false
      }
    }
  },
  required: ["users"]
}
```

### Enum Values

```typescript
{
  properties: {
    difficulty: {
      type: "string",
      enum: ["easy", "medium", "hard"]
    }
  },
  required: ["difficulty"]
}
```

### Nested Objects

```typescript
{
  properties: {
    course: {
      type: "object",
      properties: {
        title: { type: "string" },
        instructor: {
          type: "object",
          properties: {
            name: { type: "string" },
            bio: { type: "string" }
          },
          required: ["name", "bio"],
          additionalProperties: false
        }
      },
      required: ["title", "instructor"],
      additionalProperties: false
    }
  },
  required: ["course"]
}
```

## Complete Examples

See `use-openai.example.tsx` for complete working examples including:

- Course outline generator
- Text summarizer
- Quiz question generator

## Error Handling

The hook automatically handles errors and provides error messages:

```tsx
const { generate, error } = useOpenAI()

const handleGenerate = async () => {
  const result = await generate({ prompt, schema })
  
  if (result.error) {
    console.error("Generation failed:", result.error)
  }
}

// Or use the error state directly
{error && <div className="text-red-500">{error}</div>}
```

## TypeScript Support

You can specify the return type for better type safety:

```typescript
interface CourseOutline {
  title: string
  modules: Array<{
    name: string
    topics: string[]
  }>
}

const { generate } = useOpenAI()

const result = await generate<CourseOutline>({
  prompt: "Create a course outline",
  schema: { /* ... */ }
})

// result.data is typed as CourseOutline | null
```

## Notes

- The hook uses OpenAI's Structured Outputs feature with `strict: true` for reliable JSON responses
- All schemas automatically include `additionalProperties: false` at the root level
- The model defaults to `gpt-4o-mini` for cost-effective generation
- API calls are made client-side, so the API key must be prefixed with `NEXT_PUBLIC_`

## Security Considerations

⚠️ **Important**: Since this hook makes API calls from the client, your API key will be exposed in the browser. For production applications, consider:

1. Creating a server-side API route to proxy OpenAI requests
2. Implementing rate limiting
3. Adding authentication to your API endpoints
4. Using environment variables that are only available server-side
