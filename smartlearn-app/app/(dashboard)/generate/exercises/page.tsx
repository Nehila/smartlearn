"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { IconClipboardCheck, IconLoader2, IconUpload, IconPlus, IconFileText, IconCalendar, IconArrowRight } from "@tabler/icons-react"

export default function GenerateExercisesPage() {
  const router = useRouter()
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Form State
  const [topic, setTopic] = useState("")
  const [description, setDescription] = useState("")
  const [difficulty, setDifficulty] = useState("intermediate")
  const [questionsCount, setQuestionsCount] = useState([10])
  const [files, setFiles] = useState<FileList | null>(null)

  useEffect(() => {
    fetchQuizzes()
  }, [])

  const fetchQuizzes = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8008'}/api/quizzes`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setQuizzes(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch quizzes", error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setGenerating(true)

    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()

      formData.append('topic', topic)
      formData.append('description', description)
      formData.append('difficulty', difficulty)
      formData.append('questionsCount', questionsCount[0].toString())

      if (files) {
        for (let i = 0; i < files.length; i++) {
          formData.append('files', files[i])
        }
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8008'}/api/quizzes/generate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      })

      const data = await res.json()

      if (data.success) {
        setOpen(false)
        fetchQuizzes() // Refresh list
        router.refresh()
        // Optionally navigate to details
        // router.push(`/quizzes/${data.data._id}`)
      } else {
        alert("Generation failed: " + data.message)
      }

    } catch (error) {
      console.error("Failed to generate", error)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Generate Exercises</h1>
          <p className="text-muted-foreground mt-1">Practice with AI-generated quizzes tailored to your study material.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 shadow-sm">
              <IconPlus className="mr-2 size-5" />
              Create New Quiz
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Generate New Quiz</DialogTitle>
              <DialogDescription>
                Upload documents or describe a topic to generate study questions.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleGenerate} className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  placeholder="e.g. Organic Chemistry, React Hooks..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Instructions / Context</Label>
                <Textarea
                  id="description"
                  placeholder="Add specific focus areas or paste content..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Questions ({questionsCount})</Label>
                  <Slider
                    value={questionsCount}
                    onValueChange={setQuestionsCount}
                    min={5}
                    max={30}
                    step={5}
                    className="py-2"
                  />
                </div>
              </div>

              <div className="space-y-2 border-2 border-dashed rounded-md p-4 bg-slate-50">
                <Label htmlFor="files" className="cursor-pointer flex flex-col items-center gap-2">
                  <IconUpload className="size-6 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">Upload Source Documents</span>
                  <span className="text-xs text-muted-foreground">PDF, TXT, DOCX supported</span>
                </Label>
                <Input
                  id="files"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => setFiles(e.target.files)}
                  accept=".pdf,.txt,.md,.docx"
                />
                {files && files.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Array.from(files).map((f, i) => (
                      <Badge key={i} variant="secondary" className="font-normal">
                        {f.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={generating}>
                  {generating ? <><IconLoader2 className="mr-2 animate-spin" /> Generating...</> : "Generate App"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <IconLoader2 className="animate-spin mr-2" /> Loading exercises...
        </div>
      ) : quizzes.length === 0 ? (
        <div className="text-center p-12 border rounded-lg bg-slate-50 text-muted-foreground">
          <IconClipboardCheck className="mx-auto size-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900">No exercises yet</h3>
          <p>Create your first AI-generated quiz to start practicing.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <Card key={quiz._id} className="group hover:shadow-xl transition-all duration-300 border-slate-200 hover:border-blue-400 flex flex-col overflow-hidden bg-gradient-to-br from-white to-slate-50">
              <CardHeader className="pb-3 bg-white">
                <div className="flex justify-between items-start mb-2">
                  <Badge
                    variant={quiz.generatedBy === 'ai-custom' ? 'default' : 'secondary'}
                    className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 border-blue-200"
                  >
                    AI Generated
                  </Badge>
                  {quiz.status === 'completed' && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-full">
                      <IconClipboardCheck className="text-green-600 size-3.5" />
                      <span className="text-xs font-bold text-green-700">{quiz.score}%</span>
                    </div>
                  )}
                </div>
                <CardTitle className="text-lg font-bold line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
                  {quiz.title}
                </CardTitle>
                <CardDescription className="line-clamp-2 text-xs leading-relaxed mt-1.5 text-slate-600">
                  {quiz.description || "No description provided."}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-3 flex-1">
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <IconFileText className="size-3.5" />
                      <span className="font-medium">{quiz.questions?.length || 0} Questions</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <IconCalendar className="size-3.5" />
                      <span>{new Date(quiz.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {quiz.questions && quiz.questions.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-medium">
                        <span className="text-slate-600">Progress</span>
                        <span className={`${quiz.status === 'completed' ? 'text-green-600' : 'text-blue-600'}`}>
                          {Math.round((Object.keys(quiz.userAnswers || {}).length / quiz.questions.length) * 100)}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${quiz.status === 'completed'
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                              : 'bg-gradient-to-r from-blue-500 to-blue-600'
                            }`}
                          style={{ width: `${Math.round((Object.keys(quiz.userAnswers || {}).length / quiz.questions.length) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button
                  className={`w-full font-semibold transition-all duration-200 h-10 ${quiz.status === 'completed'
                      ? 'bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900'
                      : quiz.status === 'in-progress'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                        : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                    }`}
                  onClick={() => router.push(`/quizzes/${quiz._id}`)}
                >
                  {quiz.status === 'completed' ? 'View Results' : (quiz.status === 'in-progress' ? 'Resume Quiz' : 'Start Quiz')}
                  <IconArrowRight className="ml-2 size-3.5" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
