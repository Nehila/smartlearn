"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import {
    IconBook,
    IconClock,
    IconArrowLeft,
    IconChevronRight,
    IconChevronDown,
    IconLoader2,
    IconSparkles,
    IconCheck
} from "@tabler/icons-react"
import { useOpenAI } from "@/hooks/use-openai"
import { cn } from "@/lib/utils"

interface Topic {
    _id: string
    title: string
    content?: string
    isCompleted?: boolean
}

interface Module {
    _id: string
    name: string
    topics: Topic[]
}

export default function CourseDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const { generate } = useOpenAI()

    const [course, setCourse] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [selectedTopic, setSelectedTopic] = useState<{ moduleId: string, topicId: string, title: string, content?: string, isCompleted?: boolean } | null>(null)
    const [expandedModules, setExpandedModules] = useState<string[]>([])
    const [generatingContent, setGeneratingContent] = useState(false)

    // Fetch Course
    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const token = localStorage.getItem('token')
                if (!token) return

                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8008'}/api/courses/${params.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                const data = await res.json()

                if (data.success) {
                    setCourse(data.data)
                    // Default expand first module
                    if (data.data.modules?.length > 0) {
                        setExpandedModules([data.data.modules[0]._id])
                    }
                }
            } catch (error) {
                console.error("Failed to fetch course details", error)
            } finally {
                setLoading(false)
            }
        }

        if (params.id) {
            fetchCourse()
        }
    }, [params.id])

    // Toggle Module Expansion
    const toggleModule = (moduleId: string) => {
        setExpandedModules(prev =>
            prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
        )
    }

    // Toggle Completion
    const handleToggleCompletion = async (module: Module, topic: Topic) => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8008'}/api/courses/toggle-completion`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    courseId: course._id,
                    moduleId: module._id,
                    topicId: topic._id
                })
            })
            const data = await res.json()

            if (data.success) {
                // Update local state
                setCourse((prev: any) => {
                    const newModules = prev.modules.map((m: any) => {
                        if (m._id === module._id) {
                            return {
                                ...m,
                                topics: m.topics.map((t: any) => t._id === topic._id ? { ...t, isCompleted: data.data.isCompleted } : t)
                            }
                        }
                        return m
                    })
                    return { ...prev, modules: newModules, progress: data.data.progress }
                })

                if (selectedTopic?.topicId === topic._id) {
                    setSelectedTopic(prev => prev ? { ...prev, isCompleted: data.data.isCompleted } : null)
                }
            }
        } catch (error) {
            console.error("Failed to toggle completion", error)
        }
    }

    // Select Topic & Generate Content if needed
    const handleTopicClick = async (module: Module, topic: Topic) => {
        setSelectedTopic({ moduleId: module._id, topicId: topic._id, title: topic.title, content: topic.content, isCompleted: topic.isCompleted })

        // If no content, generate it
        if (!topic.content || topic.content.length < 50) {
            setGeneratingContent(true)
            try {
                const prompt = `Write a comprehensive, engaging lesson explanation for the topic: "${topic.title}".
         Context: This is part of the module "${module.name}" in the course "${course.title}".
         Target Audience: ${course.difficulty} level learners.
         
         Format: Markdown.
         Structure:
         1. Introduction (Concept)
         2. Key Concepts / Theory
         3. Practical Examples (Code blocks if technical)
         4. Real-world Application
         5. Summary
         
         Length: Detailed (approx 2-5 pages of reading). Make it look good with headers, bold text, lists, and code blocks.`

                const schema = {
                    properties: {
                        markdownContent: { type: "string", description: "The full lesson content in markdown format" }
                    },
                    required: ["markdownContent"],
                    additionalProperties: false
                }

                const result = await generate({
                    prompt,
                    schema,
                    systemPrompt: "You are an expert educator. Create high-quality, detailed, and formatted educational content."
                })

                if (result.data && result.data.markdownContent) {
                    const newContent = result.data.markdownContent

                    // Save to Backend
                    const token = localStorage.getItem('token')
                    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8008'}/api/courses/update-topic`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            courseId: course._id,
                            moduleId: module._id,
                            topicId: topic._id,
                            content: newContent
                        })
                    })

                    // Update local state
                    setCourse((prev: any) => {
                        const newModules = prev.modules.map((m: any) => {
                            if (m._id === module._id) {
                                return {
                                    ...m,
                                    topics: m.topics.map((t: any) => t._id === topic._id ? { ...t, content: newContent } : t)
                                }
                            }
                            return m
                        })
                        return { ...prev, modules: newModules }
                    })

                    setSelectedTopic(prev => prev ? { ...prev, content: newContent } : null)
                }

            } catch (error) {
                console.error("Failed to generate content", error)
            } finally {
                setGeneratingContent(false)
            }
        }
    }

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading course content...</div>
    if (!course) return <div className="p-8 text-center">Course not found</div>

    return (
        <div className="flex h-[calc(100vh-4rem)] flex-col md:flex-row bg-slate-50/50">

            {/* Sidebar: Course Structure */}
            <div className="w-full md:w-80 border-r bg-white flex flex-col h-full overflow-hidden shrink-0">
                <div className="p-4 border-b space-y-4 bg-slate-50">
                    <div className="flex items-center justify-between">
                        <Button variant="ghost" size="icon" onClick={() => router.push('/courses')} className="mr-2 h-8 w-8">
                            <IconArrowLeft className="size-4" />
                        </Button>
                        <h2 className="font-semibold text-sm truncate flex-1" title={course.title}>{course.title}</h2>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Course Progress</span>
                            <span>{course.progress || 0}%</span>
                        </div>
                        <Progress value={course.progress || 0} className="h-2" />
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-4">
                        {course.modules?.map((module: Module, modIndex: number) => (
                            <div key={module._id || modIndex} className="space-y-1">
                                <button
                                    onClick={() => toggleModule(module._id)}
                                    className="flex w-full items-center justify-between py-2 text-sm font-medium hover:text-blue-600 transition-colors"
                                >
                                    <span className="truncate flex-1 text-left">{modIndex + 1}. {module.name}</span>
                                    {expandedModules.includes(module._id) ? <IconChevronDown className="size-4" /> : <IconChevronRight className="size-4" />}
                                </button>

                                {expandedModules.includes(module._id) && (
                                    <div className="pl-4 space-y-1 border-l-2 border-slate-100 ml-2">
                                        {module.topics?.map((topic: Topic, topicIndex: number) => (
                                            <div
                                                key={topic._id || topicIndex}
                                                className={cn(
                                                    "flex w-full items-start gap-2 py-1.5 px-2 rounded-md transition-all group",
                                                    selectedTopic?.topicId === topic._id
                                                        ? "bg-blue-50"
                                                        : "hover:bg-slate-100"
                                                )}
                                            >
                                                <Checkbox
                                                    id={`topic-${topic._id}`}
                                                    checked={topic.isCompleted}
                                                    onCheckedChange={() => handleToggleCompletion(module, topic)}
                                                    className="mt-0.5 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                                />
                                                <button
                                                    onClick={() => handleTopicClick(module, topic)}
                                                    className={cn(
                                                        "text-xs text-left grow leading-tight",
                                                        selectedTopic?.topicId === topic._id ? "text-blue-700 font-medium" : "text-slate-600",
                                                        topic.isCompleted && "line-through text-slate-400"
                                                    )}
                                                >
                                                    {topic.title}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-auto h-full bg-white relative">
                {selectedTopic ? (
                    <div className="max-w-4xl mx-auto p-8 md:p-12 pb-24">
                        <div className="mb-8 pb-6 border-b">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                                <Badge variant="outline">Module: {course.modules.find((m: any) => m._id === selectedTopic.moduleId)?.name}</Badge>
                                <span className="flex items-center gap-1"><IconClock className="size-3" /> 15 min read</span>
                                {selectedTopic.isCompleted && <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Completed</Badge>}
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                                {selectedTopic.title}
                            </h1>
                        </div>

                        {generatingContent ? (
                            <div className="flex flex-col items-center justify-center py-20 space-y-6">
                                <div className="relative">
                                    <IconSparkles className="size-16 text-blue-400 animate-pulse" />
                                    <IconLoader2 className="absolute top-0 right-0 size-8 text-blue-600 animate-spin" />
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="text-xl font-semibold">Generating Lesson Content...</h3>
                                    <p className="text-muted-foreground max-w-md">
                                        Our AI is writing a detailed explanation, examples, and summary for "{selectedTopic.title}". This may take a moment.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <article className="prose prose-slate prose-lg max-w-none dark:prose-invert prose-headings:text-slate-800 prose-a:text-blue-600 prose-img:rounded-xl">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {selectedTopic.content || ""}
                                </ReactMarkdown>
                            </article>
                        )}

                        {!generatingContent && (
                            <div className="mt-12 pt-8 border-t flex justify-center">
                                <Button
                                    size="lg"
                                    variant={selectedTopic.isCompleted ? "outline" : "default"}
                                    className={cn(
                                        "min-w-[200px] gap-2",
                                        selectedTopic.isCompleted ? "border-green-600 text-green-700 hover:text-green-800 hover:bg-green-50" : "bg-blue-600 hover:bg-blue-700"
                                    )}
                                    onClick={() => {
                                        const module = course.modules.find((m: any) => m._id === selectedTopic?.moduleId)
                                        const topic = module?.topics.find((t: any) => t._id === selectedTopic?.topicId)
                                        if (module && topic) handleToggleCompletion(module, topic)
                                    }}
                                >
                                    {selectedTopic.isCompleted ? (
                                        <>
                                            <IconCheck className="size-4" />
                                            Completed
                                        </>
                                    ) : (
                                        <>
                                            <IconCheck className="size-4" />
                                            Mark as Complete
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 text-slate-400">
                        <IconBook className="size-16 mb-4 opacity-20" />
                        <h2 className="text-xl font-semibold text-slate-700">Select a topic to start learning</h2>
                        <p className="text-sm mt-2 max-w-md mx-auto">
                            Browse the modules on the left and click on a topic to view its detailed lesson content.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
