"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardTitle, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { IconLoader2, IconCheck, IconX, IconArrowLeft, IconArrowRight, IconFlag } from "@tabler/icons-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function QuizPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [quiz, setQuiz] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
    const [status, setStatus] = useState<'not-started' | 'in-progress' | 'completed'>('not-started')
    const [submitting, setSubmitting] = useState(false)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

    useEffect(() => {
        fetchQuiz()
    }, [])

    const fetchQuiz = async () => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8008'}/api/quizzes/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (data.success) {
                setQuiz(data.data)
                // Convert Map to Object if needed, or if backend sends object
                const uAnswers = data.data.userAnswers || {}
                setUserAnswers(uAnswers)
                setStatus(data.data.status)
            }
        } catch (error) {
            console.error("Failed to fetch quiz", error)
        } finally {
            setLoading(false)
        }
    }

    const handleAnswer = async (questionId: string, value: string) => {
        if (status === 'completed') return // Read-only if completed

        const newAnswers = { ...userAnswers, [questionId]: value }
        setUserAnswers(newAnswers)

        // Auto-save logic (debounced ideally, but immediate for now for simplicity)
        try {
            const token = localStorage.getItem('token')
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8008'}/api/quizzes/${id}/progress`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ answers: { [questionId]: value } })
            })
        } catch (error) {
            console.error("Failed to save progress", error)
        }
    }

    const handleSubmit = async () => {
        if (!confirm("Are you sure you want to submit your quiz? You cannot change answers after submission.")) return;

        setSubmitting(true)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8008'}/api/quizzes/${id}/submit`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (data.success) {
                setQuiz(data.data)
                setStatus('completed')
                // Scroll to top or show summary
            }
        } catch (error) {
            console.error("Failed to submit", error)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return <div className="flex h-screen items-center justify-center"><IconLoader2 className="animate-spin size-8" /></div>
    }

    if (!quiz) {
        return <div className="p-8">Quiz not found</div>
    }

    const currentQuestion = quiz.questions[currentQuestionIndex]
    const isCompleted = status === 'completed'
    const totalQuestions = quiz.questions.length
    const answeredCount = Object.keys(userAnswers).length
    const progress = Math.round((answeredCount / totalQuestions) * 100)

    return (
        <div className="flex flex-col gap-4 px-4 pt-4 pb-0 max-w-3xl mx-auto w-full">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => router.back()} className="gap-2">
                    <IconArrowLeft className="size-4" /> Back to List
                </Button>
                <div>
                    {isCompleted && (
                        <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-bold">
                            Score: {quiz.score}%
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <h1 className="text-2xl font-bold">{quiz.title}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <Progress value={progress} className="w-full h-2" />
                    <span className="whitespace-nowrap">{answeredCount} / {totalQuestions} answered</span>
                </div>
            </div>

            <Card className="flex flex-col py-0 gap-0 shadow-lg border-slate-200">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 p-4">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-600 uppercase tracking-widest">
                            Question {currentQuestionIndex + 1} of {totalQuestions}
                        </span>
                        {isCompleted && (
                            userAnswers[currentQuestion._id] === currentQuestion.correctAnswer ? (
                                <span className="text-green-600 flex items-center text-sm font-bold gap-1"><IconCheck className="size-4" /> Correct</span>
                            ) : (
                                <span className="text-red-600 flex items-center text-sm font-bold gap-1"><IconX className="size-4" /> Incorrect</span>
                            )
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6 bg-white">
                    <p className="text-xl font-semibold leading-relaxed text-slate-900">{currentQuestion.question}</p>

                    <RadioGroup
                        value={userAnswers[currentQuestion._id] || ""}
                        onValueChange={(val) => handleAnswer(currentQuestion._id, val)}
                        disabled={isCompleted}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                        {currentQuestion.options.map((option: string, _: number) => (
                            <div key={option} className={`flex items-start space-x-3 border-2 rounded-xl p-4 transition-all duration-200 h-full cursor-pointer ${isCompleted && option === currentQuestion.correctAnswer
                                ? "bg-green-50 border-green-400 shadow-sm"
                                : isCompleted && userAnswers[currentQuestion._id] === option && option !== currentQuestion.correctAnswer
                                    ? "bg-red-50 border-red-400 shadow-sm"
                                    : userAnswers[currentQuestion._id] === option
                                        ? "bg-blue-50 border-blue-500 ring-2 ring-blue-200 shadow-md"
                                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm"
                                }`}>
                                <RadioGroupItem value={option} id={option} className="mt-1" />
                                <Label htmlFor={option} className="flex-1 cursor-pointer font-medium text-base leading-relaxed text-slate-700">{option}</Label>
                                {isCompleted && option === currentQuestion.correctAnswer && (
                                    <IconCheck className="text-green-600 size-5 shrink-0" />
                                )}
                            </div>
                        ))}
                    </RadioGroup>

                    {isCompleted && (
                        <Alert className="bg-blue-50 border-blue-100 text-blue-900 mt-4">
                            <IconFlag className="size-4" />
                            <AlertTitle>Explanation</AlertTitle>
                            <AlertDescription>
                                {currentQuestion.explanation || "No explanation provided."}
                            </AlertDescription>
                        </Alert>
                    )}

                </CardContent>
                <CardFooter className="px-6 py-4 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 flex justify-between">
                    <Button
                        variant="outline"
                        onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentQuestionIndex === 0}
                    >
                        <IconArrowLeft className="mr-2 size-4" /> Previous
                    </Button>

                    {currentQuestionIndex < totalQuestions - 1 ? (
                        <Button
                            onClick={() => setCurrentQuestionIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Next <IconArrowRight className="ml-2 size-4" />
                        </Button>
                    ) : (
                        !isCompleted ? (
                            <Button onClick={handleSubmit} disabled={submitting} className="bg-green-600 hover:bg-green-700">
                                {submitting ? <IconLoader2 className="animate-spin mr-2" /> : <IconCheck className="mr-2 size-4" />}
                                Submit Quiz
                            </Button>
                        ) : (
                            <Button variant="secondary" disabled>
                                Quiz Completed
                            </Button>
                        )
                    )}
                </CardFooter>
            </Card>
        </div>
    )
}
