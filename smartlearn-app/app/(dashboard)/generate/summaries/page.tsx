"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IconPlus, IconLoader2, IconFileText, IconCalendar, IconArrowRight, IconSparkles, IconFileDescription, IconClock } from "@tabler/icons-react"

export default function GenerateSummariesPage() {
  const router = useRouter()
  const [summaries, setSummaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [stats, setStats] = useState({ total: 0, thisWeek: 0, totalWords: 0 })

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    prompt: "",
    file: null,
    model: "openai" // Default to OpenAI
  })

  useEffect(() => {
    fetchSummaries()
  }, [])

  const fetchSummaries = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8008'}/api/summaries`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setSummaries(data.data)
        calculateStats(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch summaries", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (summariesData) => {
    const total = summariesData.length
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const thisWeek = summariesData.filter(s => new Date(s.createdAt) >= oneWeekAgo).length
    const totalWords = summariesData.reduce((sum, s) => sum + (s.wordCount || 0), 0)
    setStats({ total, thisWeek, totalWords })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.prompt && !formData.file) {
      alert("Please provide a prompt or upload a file")
      return
    }

    setGenerating(true)
    try {
      const token = localStorage.getItem('token')
      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title || `Summary - ${new Date().toLocaleDateString()}`)
      formDataToSend.append('prompt', formData.prompt)
      formDataToSend.append('model', formData.model)
      if (formData.file) {
        formDataToSend.append('file', formData.file)
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8008'}/api/summaries/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formDataToSend
      })

      const data = await res.json()
      if (data.success) {
        setDialogOpen(false)
        setFormData({ title: "", prompt: "", file: null, model: "openai" })
        fetchSummaries()
        router.push(`/summaries/${data.data._id}`)
      } else {
        alert(data.message || "Failed to generate summary")
      }
    } catch (error) {
      console.error("Error generating summary:", error)
      alert("Failed to generate summary")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Summaries</h1>
          <p className="text-muted-foreground mt-1">Generate concise summaries from your documents and notes</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800">
              <IconPlus className="mr-2 size-4" />
              New Summary
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Generate AI Summary</DialogTitle>
              <DialogDescription>
                Upload a document or provide text to generate a comprehensive summary
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title (Optional)</Label>
                <Input
                  id="title"
                  placeholder="e.g., Chapter 5 Summary"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prompt">Instructions / Text to Summarize</Label>
                <Textarea
                  id="prompt"
                  placeholder="Paste text here or provide specific instructions for the summary..."
                  rows={6}
                  value={formData.prompt}
                  onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">Upload Document (Optional)</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                />
                <p className="text-xs text-muted-foreground">Supported: PDF, DOCX, TXT</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">AI Model</Label>
                <Select
                  value={formData.model}
                  onValueChange={(value) => setFormData({ ...formData, model: value })}
                >
                  <SelectTrigger id="model">
                    <SelectValue placeholder="Select AI model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">
                      <div className="flex flex-col">
                        <span className="font-medium">OpenAI GPT-4o Mini</span>
                        <span className="text-xs text-muted-foreground">Advanced, high-quality summaries</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="t5">
                      <div className="flex flex-col">
                        <span className="font-medium">T5 Small (Local)</span>
                        <span className="text-xs text-muted-foreground">Fast, privacy-focused</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Choose between cloud-based OpenAI or local T5 model</p>
              </div>
              <Button type="submit" disabled={generating} className="w-full">
                {generating ? (
                  <>
                    <IconLoader2 className="mr-2 animate-spin" />
                    Generating Summary...
                  </>
                ) : (
                  <>
                    <IconSparkles className="mr-2 size-4" />
                    Generate Summary
                  </>
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900">Total Summaries</CardTitle>
            <IconFileDescription className="size-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{stats.total}</div>
            <p className="text-xs text-purple-700 mt-1">All time</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">This Week</CardTitle>
            <IconClock className="size-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.thisWeek}</div>
            <p className="text-xs text-blue-700 mt-1">Last 7 days</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900">Total Words</CardTitle>
            <IconFileText className="size-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{stats.totalWords.toLocaleString()}</div>
            <p className="text-xs text-green-700 mt-1">Generated content</p>
          </CardContent>
        </Card>
      </div>

      {/* Summaries Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <IconLoader2 className="animate-spin mr-2" /> Loading summaries...
        </div>
      ) : summaries.length === 0 ? (
        <div className="text-center p-12 border rounded-lg bg-slate-50 text-muted-foreground">
          <IconFileDescription className="mx-auto size-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900">No summaries yet</h3>
          <p>Create your first AI-generated summary to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 gap-4">
          {summaries.map((summary) => (
            <Card key={summary._id} className="group hover:shadow-lg transition-all duration-200 border border-slate-200/60 hover:border-slate-300 flex flex-col bg-white rounded-xl overflow-hidden">
              <CardHeader className="px-5 pb-0 space-y-2.5">
                <div className="flex justify-between items-start">
                  <Badge variant="secondary" className="text-[9px] px-2 py-0.5 font-medium bg-slate-100 text-slate-600 border-0 rounded-md">
                    AI Generated
                  </Badge>
                  <span className="text-[9px] text-slate-400 font-medium">
                    {new Date(summary.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold line-clamp-2 text-slate-900 leading-snug mb-1.5">
                    {summary.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 text-xs text-slate-500 leading-relaxed">
                    {summary.prompt}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-2.5 border-t border-slate-100">
                  <IconFileText className="size-3.5 text-slate-400" strokeWidth={2} />
                  <span className="font-medium">{summary.wordCount?.toLocaleString() || 0} words</span>
                  {summary.sourceFile && (
                    <>
                      <span className="mx-1">•</span>
                      <span className="text-slate-400">File</span>
                    </>
                  )}
                </div>
              </CardContent>
              <CardFooter className="px-3 pt-0">
                <Button
                  className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition-all shadow-sm hover:shadow-md rounded-lg"
                  onClick={() => router.push(`/summaries/${summary._id}`)}
                >
                  View Summary
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
