"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IconLoader2, IconArrowLeft, IconFileText, IconCalendar, IconDownload } from "@tabler/icons-react"
import ReactMarkdown from 'react-markdown'

export default function SummaryViewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [summary, setSummary] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchSummary()
    }, [])

    const fetchSummary = async () => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8008'}/api/summaries/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (data.success) {
                setSummary(data.data)
            }
        } catch (error) {
            console.error("Failed to fetch summary", error)
        } finally {
            setLoading(false)
        }
    }

    const handleDownload = () => {
        if (!summary) return
        const blob = new Blob([summary.content], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${summary.title}.md`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    if (loading) {
        return <div className="flex h-screen items-center justify-center"><IconLoader2 className="animate-spin size-8" /></div>
    }

    if (!summary) {
        return <div className="p-8">Summary not found</div>
    }

    return (
        <div className="flex flex-col gap-6 p-4 md:gap-8 md:p-8 max-w-5xl mx-auto w-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => router.back()} className="gap-2">
                    <IconArrowLeft className="size-4" /> Back to Summaries
                </Button>
                <Button onClick={handleDownload} variant="outline" className="gap-2">
                    <IconDownload className="size-4" />
                    Download Markdown
                </Button>
            </div>

            {/* Summary Info Card */}
            <Card className="border-purple-200 bg-gradient-to-br from-white to-purple-50">
                <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                            AI Generated
                        </Badge>
                        {summary.sourceFile && (
                            <Badge variant="outline">
                                <IconFileText className="size-3 mr-1" />
                                {summary.sourceFile}
                            </Badge>
                        )}
                    </div>
                    <CardTitle className="text-2xl font-bold">{summary.title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <IconFileText className="size-4" />
                            <span>{summary.wordCount} words</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <IconCalendar className="size-4" />
                            <span>{new Date(summary.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Content */}
            <Card className="shadow-lg">
                <CardContent className="p-8">
                    <div className="prose prose-slate max-w-none
            prose-headings:font-bold prose-headings:text-slate-900
            prose-h1:text-3xl prose-h1:mb-4
            prose-h2:text-2xl prose-h2:mb-3 prose-h2:mt-8
            prose-h3:text-xl prose-h3:mb-2 prose-h3:mt-6
            prose-p:text-slate-700 prose-p:leading-relaxed prose-p:mb-4
            prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
            prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6
            prose-li:text-slate-700 prose-li:mb-2
            prose-strong:text-slate-900 prose-strong:font-semibold
            prose-em:text-slate-700
            prose-code:text-purple-600 prose-code:bg-purple-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
            prose-pre:bg-slate-900 prose-pre:text-slate-100
            prose-blockquote:border-l-4 prose-blockquote:border-purple-500 prose-blockquote:pl-4 prose-blockquote:italic
          ">
                        <ReactMarkdown>{summary.content}</ReactMarkdown>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
