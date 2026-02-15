"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { IconArrowRight, IconArrowLeft, IconSparkles, IconCheck, IconLoader2 } from "@tabler/icons-react"
import { useOpenAI } from "@/hooks/use-openai"
import { Skeleton } from "@/components/ui/skeleton"

type Step = 1 | 2 | 3 | 4 | 5

interface AIQuestion {
  id: string
  question: string
  type: "select" | "multiselect" | "number"
  options?: string[]
  placeholder?: string
  min?: number
  max?: number
}

interface LearningPathData {
  // Step 1: Basic Info (static)
  domain: string
  topic: string
  currentLevel: string
  age: number | ""

  // Dynamic AI-generated answers
  aiAnswers: Record<string, any>
}

const initialData: LearningPathData = {
  domain: "",
  topic: "",
  currentLevel: "",
  age: "",
  aiAnswers: {},
}

const DOMAINS = [
  "Web Development", "Data Science", "Machine Learning", "Mobile App Development",
  "Game Development", "Cybersecurity", "Cloud Computing", "DevOps",
  "Software Engineering", "UI/UX Design", "Product Management", "Digital Marketing",
  "Blockchain", "Artificial Intelligence", "Internet of Things (IoT)", "Robotics",
  "Database Management", "Network Administration", "System Programming",
  "Embedded Systems", "AR/VR Development", "Computer Graphics", "Bioinformatics",
  "FinTech", "E-commerce", "Salesforce", "SAP", "Digital Art", "Content Creation",
  "Business Analysis"
]

export default function PreTestPage() {
  const [step, setStep] = useState<Step>(1)
  const [formData, setFormData] = useState<LearningPathData>(initialData)
  const [aiQuestions, setAiQuestions] = useState<Record<number, AIQuestion[]>>({})
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [generatedPath, setGeneratedPath] = useState<any>(null)
  const { generate, isLoading, error } = useOpenAI()
  const router = useRouter()

  useEffect(() => {
    setFormData(initialData)
    setStep(1)
    setAiQuestions({})
    setGeneratedPath(null)
  }, [])

  const updateField = (field: keyof LearningPathData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const updateAIAnswer = (questionId: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      aiAnswers: { ...prev.aiAnswers, [questionId]: value },
    }))
  }

  const toggleAIArrayAnswer = (questionId: string, value: string) => {
    setFormData((prev) => {
      const currentArray = (prev.aiAnswers[questionId] as string[]) || []
      const newArray = currentArray.includes(value)
        ? currentArray.filter((item) => item !== value)
        : [...currentArray, value]
      return {
        ...prev,
        aiAnswers: { ...prev.aiAnswers, [questionId]: newArray },
      }
    })
  }

  // Generate AI questions dynamically for a specific step based on previous answers
  const generateAIQuestions = async (targetStep: number) => {
    setLoadingQuestions(true)

    // Collect all previous answers
    const previousAnswers: string[] = []
    previousAnswers.push(`Domain: ${formData.domain}`)
    previousAnswers.push(`Age: ${formData.age}`)

    // Add answers from previous steps
    Object.entries(formData.aiAnswers).forEach(([questionId, answer]) => {
      const allQuestions = Object.values(aiQuestions).flat()
      const question = allQuestions.find((q) => q.id === questionId)
      if (question) {
        const answerText = Array.isArray(answer) ? answer.join(", ") : String(answer)
        previousAnswers.push(`${question.question}: ${answerText}`)
      }
    })

    // Determine what type of questions to generate based on step
    let questionFocus = ""
    if (targetStep === 2) {
      // Step 2: Interest, Preferences + AI generated
      questionFocus = `Generate exactly 4 questions.
      
      The FIRST 2 questions MUST be these exact topics:
      1. "Specific Interests" within the topic of ${formData.topic} (Type: multiselect). Options must be specific technical sub-topics or areas.
      2. "Learning Resource Preferences" (Type: multiselect). Options should be "Video tutorials", "Documentation/Reading", "Interactive coding", "Hands-on Projects".
      
      The LAST 2 questions must be content-focused:
      - Ask about their specific end-goal project or skill application.
      - Ask about the depth of knowledge they want to achieve in specific areas.
      
      DO NOT ask about job status, available time, or previous background.`
    } else if (targetStep === 3) {
      questionFocus = `Generate 2-3 personalized questions focusing STRICTLY on the SUBJECT MATTER:
- Specific tools, libraries, or frameworks they want to prioritize within ${formData.topic}
- Theoretical vs. Practical focus balance
- Specific areas of ${formData.topic} they find most exciting

DO NOT ask about job status, previous platforms, or general demographics.`
    } else if (targetStep === 4) {
      questionFocus = `Generate 2-3 personalized questions focusing on PROJECT GOALS:
- The type of projects they want to build (e.g. "E-commerce site", "Data analysis dashboard", "Game", etc.)
- The specific skills they want to demonstrate
- Any specific industry application they are interested in (e.g. "Healthcare", "Finance", "Entropy")

DO NOT ask about "challenges", "time management", or "learning formats" again.`
    }

    const prompt = `Based on the following information about a learner:

Previous Information:
${previousAnswers.join("\n")}

${questionFocus}

IMPORTANT: YOU MUST NOT GENERATE OPEN-ENDED TEXT QUESTIONS.
- Use "select" (dropdown) for questions with single choice from predefined options.
- Use "multiselect" (checkboxes) for questions where multiple selections are allowed.
- Use "number" for quantitative questions (hours, years, count, etc.).

Make questions specific to their chosen DOMAIN (${formData.domain}) and AGE (${formData.age}, adjust tone/content accordingly), and build upon their previous answers. Don't ask questions we already know the answer to.
For the "Specific Interests" and "Learning Preferences" questions in Step 2, ensure the OPTIONS are relevant to the domain and age.`

    const schema = {
      properties: {
        questions: {
          type: "array",
          description: "2-5 personalized questions for this step",
          items: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: `Unique question ID for step ${targetStep} (e.g., 'step${targetStep}-q1', 'step${targetStep}-q2')`,
              },
              question: {
                type: "string",
                description: "The question text",
              },
              type: {
                type: "string",
                enum: ["select", "multiselect", "number"],
                description: "Type of input. MUST BE strictly one of: 'select', 'multiselect', or 'number'. Do NOT use 'text' or 'checkbox'.",
              },
              options: {
                type: "array",
                description: "Options for select/multiselect. MUST be populated for select/multiselect types with AI-generated relevant choices. Empty array for number inputs.",
                items: {
                  type: "string",
                },
              },
            },
            required: ["id", "question", "type", "options"],
            additionalProperties: false,
          },
        },
      },
      required: ["questions"],
    }

    const result = await generate({
      prompt,
      schema,
      systemPrompt: "You are an expert learning advisor. Generate thoughtful, personalized questions that build upon previous answers. Each question should be specific, relevant, and use the most appropriate input type. IMPORTANT: NEVER use open-ended 'text' inputs. Only use 'select', 'multiselect', or 'number'. Always provide relevant 'options' for select/multiselect questions.",
    })

    if (result.data && result.data.questions) {
      console.log(`AI Questions generated for step ${targetStep}:`, result.data.questions)
      setAiQuestions((prev) => ({
        ...prev,
        [targetStep]: result.data.questions,
      }))
    } else {
      console.error("No questions in result:", result)
    }

    setLoadingQuestions(false)
  }

  const saveProgress = async (status: 'draft' | 'active', currentQuestions: any = null, learningPathData: any = null) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Extract raw question objects from the nested map
      const questionsToSave = currentQuestions ? { ...aiQuestions, ...currentQuestions } : { ...aiQuestions };

      const payload = {
        domain: formData.domain,
        topic: formData.topic,
        currentLevel: formData.currentLevel,
        age: formData.age,
        step: step,
        aiQuestions: questionsToSave,
        aiAnswers: formData.aiAnswers,
        learningPathData: learningPathData // Send generated path if finalizing
      };

      const endpoint = status === 'active' ? '/api/pre-test/finalize' : '/api/pre-test/draft';

      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8008'}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (status === 'active') {
        router.push('/learning-path');
      }

    } catch (error) {
      console.error("Failed to save progress", error);
    }
  }

  const nextStep = async () => {
    if (step === 1) {
      // Move to step 2 first to show loading state
      setStep(2)
      // Generate AI questions for step 2 based on step 1 answers
      await generateAIQuestions(2)
      // Save draft after generating questions for step 2
      saveProgress('draft');
    } else if (step === 2) {
      // Move to step 3 and generate questions based on all previous answers
      setStep(3)
      await generateAIQuestions(3)
      saveProgress('draft');
    } else if (step === 3) {
      // Move to step 4 and generate questions based on all previous answers
      setStep(4)
      await generateAIQuestions(4)
      saveProgress('draft');
    } else if (step === 4) {
      // Move to review step
      setStep(5)
      saveProgress('draft');
    }
  }

  const prevStep = () => {
    if (step > 1) setStep((step - 1) as Step)
  }

  const generateLearningPath = async () => {
    // Compile all answers - get all questions from all steps
    const allQuestions = Object.values(aiQuestions).flat()
    const aiAnswersText = Object.entries(formData.aiAnswers)
      .map(([questionId, answer]) => {
        const question = allQuestions.find((q) => q.id === questionId)
        if (!question) return ""
        return `${question.question}: ${Array.isArray(answer) ? answer.join(", ") : answer}`
      })
      .filter(Boolean)
      .join("\n")

    // Removed premature saveProgress('active') call here to prevent locking the session before generation completes

    const prompt = `Create a comprehensive personalized learning path based on the following information:

Domain: ${formData.domain}
Age: ${formData.age}

Additional Information:
${aiAnswersText}

Create a detailed learning path with courses, milestones, and recommendations suitable for this person.`

    const schema = {
      properties: {
        pathTitle: {
          type: "string",
          description: "A motivating title for the learning path",
        },
        overview: {
          type: "string",
          description: "A brief overview of the learning journey",
        },
        estimatedDuration: {
          type: "string",
          description: "Total estimated time to complete (e.g., '3 months')",
        },
        courses: {
          type: "array",
          description: "Recommended courses in order",
          items: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "Course title",
              },
              description: {
                type: "string",
                description: "What the course covers",
              },
              difficulty: {
                type: "string",
                enum: ["beginner", "intermediate", "advanced"],
              },
              duration: {
                type: "string",
                description: "Estimated time (e.g., '2 weeks')",
              },
              modules: {
                type: "array",
                items: {
                  type: "string",
                },
                description: "Key modules/topics in the course",
              },
            },
            required: ["title", "description", "difficulty", "duration", "modules"],
            additionalProperties: false,
          },
        },
        milestones: {
          type: "array",
          description: "Key milestones in the learning journey",
          items: {
            type: "object",
            properties: {
              week: {
                type: "number",
                description: "Week number",
              },
              title: {
                type: "string",
                description: "Milestone title",
              },
              description: {
                type: "string",
                description: "What should be achieved",
              },
            },
            required: ["week", "title", "description"],
            additionalProperties: false,
          },
        },
        recommendations: {
          type: "array",
          description: "Personalized recommendations",
          items: {
            type: "string",
          },
        },
        resources: {
          type: "array",
          description: "Additional learning resources",
          items: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["book", "video", "article", "tool", "community"],
              },
              title: {
                type: "string",
                description: "Title of the resource",
              },
              description: {
                type: "string",
              },
            },
            required: ["type", "title", "description"],
            additionalProperties: false,
          },
        },
      },
      required: ["pathTitle", "overview", "estimatedDuration", "courses", "milestones", "recommendations", "resources"],
    }

    const result = await generate({
      prompt,
      schema,
      systemPrompt: "You are an expert learning path designer. Create comprehensive, personalized learning paths that match the user's goals, level, and preferences. Be specific and actionable.",
    })

    if (result.data) {
      setGeneratedPath(result.data)
      setStep(5)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle>What do you want to learn?</CardTitle>
              <CardDescription>Tell us about your learning goals and background</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Domain *</Label>
                <Select value={formData.domain} onValueChange={(value) => updateField("domain", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a domain to learn" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOMAINS.map((domain) => (
                      <SelectItem key={domain} value={domain}>
                        {domain}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic">Specific Subject *</Label>
                <Input
                  id="topic"
                  placeholder="e.g., React, Python, Digital Marketing Strategy"
                  value={formData.topic}
                  onChange={(e) => updateField("topic", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentLevel">Current Level *</Label>
                <Select value={formData.currentLevel} onValueChange={(value) => updateField("currentLevel", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your current level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="complete-beginner">Complete Beginner</SelectItem>
                    <SelectItem value="beginner">Beginner (some basics)</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="e.g., 25"
                  min={1}
                  max={100}
                  value={formData.age}
                  onChange={(e) => updateField("age", e.target.value === "" ? "" : parseInt(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>
        )

      case 2:
      case 3:
      case 4:
        if (loadingQuestions) {
          return (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <IconLoader2 className="size-5 animate-spin text-blue-600" />
                  <CardTitle>Generating Personalized Questions...</CardTitle>
                </div>
                <CardDescription>
                  We're creating questions tailored to your interest in {formData.domain}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )
        }

        // Get questions for current step
        const currentQuestions = aiQuestions[step] || []

        console.log("Rendering step", step, "Questions for this step:", currentQuestions.length)

        if (currentQuestions.length === 0 && !loadingQuestions) {
          return (
            <Card>
              <CardHeader>
                <CardTitle>No questions available</CardTitle>
                <CardDescription>
                  There was an issue generating questions. Please try again.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => { setStep(1); setAiQuestions({}); setFormData(initialData); }}>
                  Start Over
                </Button>
              </CardContent>
            </Card>
          )
        }

        return (
          <Card>
            <CardHeader>
              <CardTitle>Tell us more about your learning needs</CardTitle>
              <CardDescription>
                Step {step} of 4 - Personalized questions for {formData.domain}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentQuestions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No questions for this step.</p>
              ) : null}
              {currentQuestions.map((q) => (
                <div key={q.id} className="space-y-2">
                  <Label htmlFor={q.id}>{q.question}</Label>

                  {q.type === "select" && (
                    <Select
                      value={formData.aiAnswers[q.id] || ""}
                      onValueChange={(value) => updateAIAnswer(q.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        {q.options?.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {q.type === "multiselect" && (
                    <div className="space-y-2">
                      {q.options?.map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${q.id}-${option}`}
                            checked={((formData.aiAnswers[q.id] as string[]) || []).includes(option)}
                            onCheckedChange={() => toggleAIArrayAnswer(q.id, option)}
                          />
                          <label htmlFor={`${q.id}-${option}`} className="text-sm cursor-pointer">
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}

                  {q.type === "number" && (
                    <Input
                      id={q.id}
                      type="number"
                      placeholder={q.placeholder || "Enter a number"}
                      min={q.min}
                      max={q.max}
                      value={formData.aiAnswers[q.id] || ""}
                      onChange={(e) => {
                        const value = e.target.value === "" ? "" : Number(e.target.value)
                        updateAIAnswer(q.id, value)
                      }}
                    />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )

      case 5:
        if (generatedPath) {
          return (
            <div className="space-y-6">
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <IconSparkles className="size-6 text-blue-600" />
                    <CardTitle className="text-2xl">{generatedPath.pathTitle}</CardTitle>
                  </div>
                  <CardDescription className="text-base">{generatedPath.overview}</CardDescription>
                  <div className="mt-2 text-sm font-medium text-blue-700">
                    Estimated Duration: {generatedPath.estimatedDuration}
                  </div>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recommended Courses</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {generatedPath.courses.map((course: any, index: number) => (
                    <div key={index} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="flex size-6 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                              {index + 1}
                            </span>
                            <h3 className="font-semibold">{course.title}</h3>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">{course.description}</p>
                          <div className="mt-3 flex gap-2">
                            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium">
                              {course.difficulty}
                            </span>
                            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium">
                              {course.duration}
                            </span>
                          </div>
                          <div className="mt-3">
                            <p className="text-xs font-medium text-muted-foreground">Key Topics:</p>
                            <ul className="mt-1 space-y-1">
                              {course.modules.slice(0, 3).map((module: string, i: number) => (
                                <li key={i} className="text-xs text-muted-foreground">
                                  • {module}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Milestones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {generatedPath.milestones.map((milestone: any, index: number) => (
                      <div key={index} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="flex size-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                            {milestone.week}
                          </div>
                          {index < generatedPath.milestones.length - 1 && (
                            <div className="h-full w-px bg-blue-200" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <h4 className="font-medium">{milestone.title}</h4>
                          <p className="text-sm text-muted-foreground">{milestone.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Personalized Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {generatedPath.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <IconCheck className="mt-0.5 size-4 shrink-0 text-green-600" />
                        <span className="text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Additional Resources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2">
                    {generatedPath.resources.map((resource: any, index: number) => (
                      <div key={index} className="rounded-lg border p-3">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                            {resource.type}
                          </span>
                          <h4 className="text-sm font-medium">{resource.title}</h4>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{resource.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button onClick={() => { setGeneratedPath(null); setStep(1); setFormData(initialData); setAiQuestions({}); }} variant="outline">
                  Create New Path
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => saveProgress('active', null, generatedPath)}
                >
                  Start Learning Journey
                </Button>
              </div>
            </div>
          )
        }

        return (
          <Card>
            <CardHeader>
              <CardTitle>Review & Generate</CardTitle>
              <CardDescription>Review your information and generate your personalized learning path</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3">
                <div>
                  <p className="text-sm font-medium">Domain:</p>
                  <p className="text-sm text-muted-foreground">{formData.domain}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Topic:</p>
                  <p className="text-sm text-muted-foreground">{formData.topic}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Level:</p>
                  <p className="text-sm text-muted-foreground">{formData.currentLevel}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Age:</p>
                  <p className="text-sm text-muted-foreground">{formData.age}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Detailed Responses:</p>
                  <div className="space-y-3 pl-2 border-l-2 border-slate-200">
                    {Object.values(aiQuestions).flat().map((q) => {
                      const answer = formData.aiAnswers[q.id];
                      if (!answer) return null;
                      return (
                        <div key={q.id}>
                          <p className="text-xs font-semibold text-slate-700">{q.question}</p>
                          <p className="text-sm text-muted-foreground">
                            {Array.isArray(answer) ? answer.join(", ") : String(answer)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.domain && formData.topic && formData.currentLevel && formData.age
      case 2:
      case 3:
      case 4:
        // Check if current step questions are answered
        const currentQuestions = aiQuestions[step] || []

        if (currentQuestions.length === 0) {
          return false // Can't proceed if no questions generated yet
        }

        return currentQuestions.every((q) => {
          const answer = formData.aiAnswers[q.id]
          if (q.type === "multiselect") {
            return Array.isArray(answer) && answer.length > 0
          }
          if (q.type === "number") {
            return answer !== undefined && answer !== null && answer !== ""
          }
          return answer && answer !== ""
        })
      default:
        return true
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pre-test: Personalize Your Learning Path</h1>
            <p className="text-muted-foreground">Answer a few questions to get your personalized learning path</p>
          </div>
        </div>

        {!generatedPath && (
          <div className="flex w-full items-center">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className={`flex items-center ${s < 5 ? "flex-1" : ""}`}>
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${s === step
                    ? "bg-blue-600 text-white"
                    : s < step
                      ? "bg-green-600 text-white"
                      : "bg-slate-200 text-slate-600"
                    }`}
                >
                  {s < step ? <IconCheck className="size-4" /> : s}
                </div>
                {s < 5 && (
                  <div className={`h-px w-full mx-2 ${s < step ? "bg-green-600" : "bg-slate-200"}`} />
                )}
              </div>
            ))}
          </div>
        )}

        {renderStep()}

        {!generatedPath && (
          <div className="flex justify-between">
            <Button onClick={prevStep} disabled={step === 1 || loadingQuestions} variant="outline">
              <IconArrowLeft className="mr-2 size-4" />
              Previous
            </Button>

            {step < 4 ? (
              <Button onClick={nextStep} disabled={!canProceed() || loadingQuestions}>
                {loadingQuestions ? (
                  <>
                    <IconLoader2 className="mr-2 size-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Next
                    <IconArrowRight className="ml-2 size-4" />
                  </>
                )}
              </Button>
            ) : step === 4 ? (
              <Button onClick={nextStep} disabled={!canProceed()}>
                Review
                <IconArrowRight className="ml-2 size-4" />
              </Button>
            ) : (
              <Button onClick={generateLearningPath} disabled={isLoading || !canProceed()} className="bg-blue-600 hover:bg-blue-700">
                {isLoading ? (
                  <>
                    <IconLoader2 className="mr-2 size-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <IconSparkles className="mr-2 size-4" />
                    Generate Learning Path
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
