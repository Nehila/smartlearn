"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { IconBook, IconLoader2, IconUpload, IconWand, IconHistory, IconFileText } from "@tabler/icons-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function GenerateCoursePage() {
  const router = useRouter()
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  // Form State
  const [topic, setTopic] = useState("")
  const [description, setDescription] = useState("")
  const [difficulty, setDifficulty] = useState("beginner")
  const [depth, setDepth] = useState([3]) // 1-5 scale? Or number of modules?
  const [files, setFiles] = useState<FileList | null>(null)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8008'}/api/courses`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        // Sort by newest
        setHistory(data.data) // Assuming this returns all courses. 
        // Ideally backend filters for 'custom' or 'ai-generated' types if we distinguish them.
        // For now, listing all is "History of generated courses" effectively if user only uses AI.
      }
    } catch (error) {
      console.error("Failed to fetch history", error)
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
      formData.append('depth', depth[0].toString())

      if (files) {
        for (let i = 0; i < files.length; i++) {
          formData.append('files', files[i])
        }
      }

      // NOTE: This endpoint needs to be implemented in backend
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8008'}/api/courses/generate-custom`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
          // Content-Type is auto-set with FormData
        },
        body: formData
      })

      const data = await res.json()

      if (data.success) {
        router.push(`/courses/${data.data._id}`)
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
    <div className="flex flex-1 flex-col gap-8 p-4 md:gap-8 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Course Generator</h1>
        <p className="text-muted-foreground">Create custom courses from your own documents and prompts using AI.</p>
      </div>

      {/* Stats Cards (Mock for now, or derived from history) */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Generated Courses</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{history.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Docs Processed</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{history.reduce((acc, c) => acc + (c.sourceDocsCount || 0), 0)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Learning Hours</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{history.reduce((acc, c) => acc + (parseInt(c.duration) || 0), 0)}h</div></CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_400px]">

        {/* Generator Form */}
        <div className="space-y-6">
          <Card className="border-blue-100 shadow-md">
            <CardHeader className="">
              <div className="flex items-center gap-2 text-blue-700">
                <IconWand className="size-5" />
                <CardTitle>Create New Course</CardTitle>
              </div>
              <CardDescription>Configure AI parameters to generate your perfect syllabus.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleGenerate} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="topic">Course Topic / Title</Label>
                  <Input
                    id="topic"
                    placeholder="e.g. Advanced Python Patterns, History of Rome..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Specific Instructions / Context</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what you want to learn in detail. Paste text content here if needed."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Target Level</Label>
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

                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <Label>Course Depth (Modules)</Label>
                      <span className="text-sm text-muted-foreground">{depth[0]} Modules</span>
                    </div>
                    <Slider
                      value={depth}
                      onValueChange={setDepth}
                      min={3}
                      max={10}
                      step={1}
                      className="py-2"
                    />
                  </div>
                </div>

                <div className="space-y-2 p-4 border-2 border-dashed rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                  <Label htmlFor="files" className="cursor-pointer flex flex-col items-center gap-2">
                    <IconUpload className="size-8 text-slate-400" />
                    <span className="font-medium text-slate-700">Upload Documents (PDF, TXT, MD)</span>
                    <span className="text-xs text-muted-foreground">Optional. AI will use these as source material.</span>
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
                        <Badge key={i} variant="secondary" className="gap-1">
                          <IconFileText className="size-3" />
                          {f.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <Button type="submit" size="lg" className="w-full bg-blue-600 hover:bg-blue-700 font-semibold" disabled={generating}>
                  {generating ? (
                    <>
                      <IconLoader2 className="mr-2 size-5 animate-spin" />
                      Generating Syllabus...
                    </>
                  ) : (
                    <>
                      <IconWand className="mr-2 size-5" />
                      Generate Course
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* History Sidebar */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <IconHistory className="size-4" />
            Recent Generations
          </h3>
          {loading ? (
            <div className="text-center p-4 text-muted-foreground">Loading...</div>
          ) : history.length === 0 ? (
            <Card className="p-4 text-center text-sm text-muted-foreground bg-slate-50">
              No history yet. Generate your first course!
            </Card>
          ) : (
            <div className="space-y-3">
              {history.slice(0, 5).map((course, i) => (
                <Card
                  key={i}
                  className="p-3 cursor-pointer hover:border-blue-300 transition-all hover:shadow-sm group"
                  onClick={() => router.push(`/courses/${course._id}`)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <Badge variant="outline" className="text-[10px] h-5">{course.difficulty}</Badge>
                    <span className="text-[10px] text-muted-foreground">{new Date(course.createdAt || Date.now()).toLocaleDateString()}</span>
                  </div>
                  <h4 className="font-medium text-sm group-hover:text-blue-700 line-clamp-2">{course.title}</h4>
                  <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
                    <IconBook className="size-3" />
                    {course.modules?.length || 0} Modules
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
