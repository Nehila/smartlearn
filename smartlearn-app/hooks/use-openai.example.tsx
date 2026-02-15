/**
 * Example usage of the useOpenAI hook
 * 
 * This file demonstrates how to use the hook with different schemas
 */

import { useOpenAI } from "./use-openai"

// Example 1: Generate a course outline
export function ExampleCourseGenerator() {
  const { generate, isLoading, error, data } = useOpenAI()

  const handleGenerateCourse = async () => {
    const result = await generate({
      prompt: "Create a course outline for learning React for beginners",
      schema: {
        properties: {
          title: {
            type: "string",
            description: "The course title",
          },
          description: {
            type: "string",
            description: "A brief description of the course",
          },
          modules: {
            type: "array",
            description: "List of course modules",
            items: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "Module name",
                },
                topics: {
                  type: "array",
                  description: "Topics covered in this module",
                  items: {
                    type: "string",
                  },
                },
                duration: {
                  type: "string",
                  description: "Estimated duration (e.g., '2 hours')",
                },
              },
              required: ["name", "topics", "duration"],
              additionalProperties: false,
            },
          },
          difficulty: {
            type: "string",
            enum: ["beginner", "intermediate", "advanced"],
            description: "Course difficulty level",
          },
        },
        required: ["title", "description", "modules", "difficulty"],
      },
      systemPrompt: "You are an expert course designer. Create comprehensive and well-structured course outlines.",
    })

    if (result.data) {
      console.log("Generated course:", result.data)
    }
  }

  return (
    <div>
      <button onClick={handleGenerateCourse} disabled={isLoading}>
        {isLoading ? "Generating..." : "Generate Course"}
      </button>
      {error && <p className="text-red-500">{error}</p>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  )
}

// Example 2: Generate a summary
export function ExampleSummaryGenerator() {
  const { generate, isLoading, error, data } = useOpenAI()

  const handleGenerateSummary = async (text: string) => {
    const result = await generate({
      prompt: `Summarize the following text: ${text}`,
      schema: {
        properties: {
          summary: {
            type: "string",
            description: "A concise summary of the text",
          },
          keyPoints: {
            type: "array",
            description: "Key points from the text",
            items: {
              type: "string",
            },
          },
          wordCount: {
            type: "number",
            description: "Number of words in the summary",
          },
        },
        required: ["summary", "keyPoints", "wordCount"],
      },
    })

    if (result.data) {
      console.log("Generated summary:", result.data)
    }
  }

  return (
    <div>
      <button onClick={() => handleGenerateSummary("Your text here...")} disabled={isLoading}>
        {isLoading ? "Generating..." : "Generate Summary"}
      </button>
      {error && <p className="text-red-500">{error}</p>}
      {data && (
        <div>
          <h3>Summary:</h3>
          <p>{data.summary}</p>
          <h4>Key Points:</h4>
          <ul>
            {data.keyPoints?.map((point: string, i: number) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// Example 3: Generate quiz questions
export function ExampleQuizGenerator() {
  const { generate, isLoading, error, data } = useOpenAI()

  const handleGenerateQuiz = async (topic: string) => {
    const result = await generate({
      prompt: `Generate 5 multiple choice questions about ${topic}`,
      schema: {
        properties: {
          questions: {
            type: "array",
            description: "List of quiz questions",
            items: {
              type: "object",
              properties: {
                question: {
                  type: "string",
                  description: "The question text",
                },
                options: {
                  type: "array",
                  description: "Answer options",
                  items: {
                    type: "string",
                  },
                  minItems: 4,
                  maxItems: 4,
                },
                correctAnswer: {
                  type: "number",
                  description: "Index of the correct answer (0-3)",
                  minimum: 0,
                  maximum: 3,
                },
                explanation: {
                  type: "string",
                  description: "Explanation of the correct answer",
                },
              },
              required: ["question", "options", "correctAnswer", "explanation"],
              additionalProperties: false,
            },
          },
        },
        required: ["questions"],
      },
      systemPrompt: "You are an expert educator creating high-quality quiz questions.",
    })

    if (result.data) {
      console.log("Generated quiz:", result.data)
    }
  }

  return (
    <div>
      <button onClick={() => handleGenerateQuiz("React Hooks")} disabled={isLoading}>
        {isLoading ? "Generating..." : "Generate Quiz"}
      </button>
      {error && <p className="text-red-500">{error}</p>}
      {data && (
        <div>
          {data.questions?.map((q: any, i: number) => (
            <div key={i}>
              <h4>Question {i + 1}: {q.question}</h4>
              <ul>
                {q.options.map((opt: string, j: number) => (
                  <li key={j} className={j === q.correctAnswer ? "font-bold" : ""}>
                    {opt}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-muted-foreground">{q.explanation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
