"use client"

import { useState, useCallback } from "react"

interface UseOpenAIOptions {
  apiKey?: string
  model?: string
}

interface OpenAIRequest {
  prompt: string
  schema: Record<string, any>
  systemPrompt?: string
}

interface OpenAIResponse<T = any> {
  data: T | null
  error: string | null
  isLoading: boolean
}

export function useOpenAI(options: UseOpenAIOptions = {}) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)

  const generate = useCallback(
    async <T = any>({
      prompt,
      schema,
      systemPrompt = "You are a helpful assistant that returns structured JSON responses.",
    }: OpenAIRequest): Promise<OpenAIResponse<T>> => {
      setIsLoading(true)
      setError(null)
      setData(null)

      try {
        const apiKey = options.apiKey || process.env.NEXT_PUBLIC_OPENAI_API_KEY

        if (!apiKey) {
          throw new Error("OpenAI API key is not configured")
        }

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: options.model || "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: systemPrompt,
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "response",
                strict: true,
                schema: {
                  type: "object",
                  ...schema,
                  additionalProperties: false,
                },
              },
            },
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error?.message || "Failed to generate response")
        }

        const result = await response.json()
        const content = result.choices[0]?.message?.content

        if (!content) {
          throw new Error("No content in response")
        }

        const parsedData = JSON.parse(content) as T
        setData(parsedData)
        setIsLoading(false)

        return {
          data: parsedData,
          error: null,
          isLoading: false,
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred"
        setError(errorMessage)
        setIsLoading(false)

        return {
          data: null,
          error: errorMessage,
          isLoading: false,
        }
      }
    },
    [options.apiKey, options.model]
  )

  const reset = useCallback(() => {
    setIsLoading(false)
    setError(null)
    setData(null)
  }, [])

  return {
    generate,
    reset,
    isLoading,
    error,
    data,
  }
}
