"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  IconPlus,
  IconClock,
  IconTrendingUp,
  IconBook,
  IconTarget,
  IconCheck,
  IconDots,
  IconPlayerPlay
} from "@tabler/icons-react"
import Link from "next/link"

export default function LearningPathPage() {
  const [paths, setPaths] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchPaths = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setLoading(false)
          return
        }

        const headers = { Authorization: `Bearer ${token}` }
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8008'

        // Fetch Study Plans AND Active Courses
        const [plansRes, coursesRes] = await Promise.all([
          fetch(`${apiUrl}/api/study-plans`, { headers }),
          fetch(`${apiUrl}/api/courses`, { headers })
        ])

        const plansData = await plansRes.json()
        const coursesData = await coursesRes.json()
        const activeCourses = coursesData.success ? coursesData.data : []

        if (plansData.success) {
          // Transform backend data to match UI expectations
          const transformedPaths = plansData.data.map((plan: any) => {
            const content = plan.generatedContent || {}

            // Map courses and merge with active progress
            const mergedCourses = (content.courses || []).map((c: any) => {
              const activeCourse = activeCourses.find((ac: any) => ac.title === c.title) // Match by title

              if (activeCourse) {
                return {
                  ...c,
                  _id: activeCourse._id, // Real Course ID
                  status: activeCourse.progress === 100 ? 'completed' : (activeCourse.progress > 0 ? 'in-progress' : 'not-started'),
                  progress: activeCourse.progress || 0,
                  isActive: true
                }
              }
              return {
                ...c,
                status: 'not-started',
                progress: 0,
                isActive: false
              }
            })

            // Calculate Path Stats
            const totalCourses = mergedCourses.length
            const completedCourses = mergedCourses.filter((c: any) => c.status === 'completed').length
            const totalProgress = totalCourses > 0 ? Math.round(mergedCourses.reduce((acc: number, c: any) => acc + c.progress, 0) / totalCourses) : 0

            // Estimate time spent (mock based on progress for now, or sum active course usage if tracked)
            const timeSpent = Math.round(totalProgress * 0.5) // Rough estimate placeholder

            return {
              id: plan._id,
              title: plan.title,
              description: plan.description,
              status: totalProgress === 100 ? 'completed' : 'active',
              progress: totalProgress,
              totalCourses,
              completedCourses,
              estimatedDuration: content.estimatedDuration || "Unknown",
              timeSpent: `${timeSpent}h`,
              startedAt: new Date(plan.startDate).toISOString().split('T')[0],
              courses: mergedCourses,
              nextMilestone: content.milestones?.[0] ? {
                title: content.milestones[0].title,
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
              } : null
            }
          })
          setPaths(transformedPaths)
        }
      } catch (error) {
        console.error("Failed to fetch learning paths", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPaths()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700"
      case "completed":
        return "bg-blue-100 text-blue-700"
      case "paused":
        return "bg-yellow-100 text-yellow-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getCourseStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <IconCheck className="size-4 text-green-600" />
      case "in-progress":
        return <IconTrendingUp className="size-4 text-blue-600" />
      default:
        return <IconBook className="size-4 text-gray-400" />
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading your learning paths...</div>
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Learning Paths</h1>
          <p className="text-muted-foreground">Track your personalized learning journeys</p>
        </div>
        <Link href="/pre-test">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <IconPlus className="mr-2 size-4" />
            Create New Path
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Paths</CardTitle>
            <IconTarget className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paths.filter((p) => p.status === "active").length}</div>
            <p className="text-xs text-muted-foreground">Currently learning</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <IconBook className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paths.reduce((sum, p) => sum + p.totalCourses, 0)}</div>
            <p className="text-xs text-muted-foreground">Across all paths</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <IconCheck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paths.reduce((sum, p) => sum + p.completedCourses, 0)}</div>
            <p className="text-xs text-muted-foreground">Courses finished</p>
          </CardContent>
        </Card>
      </div>

      {/* Learning Paths */}
      <div className="grid gap-6 md:grid-cols-3">
        {paths.length === 0 ? (
          <Card className="md:col-span-3">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <IconBook className="mb-4 size-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No Learning Paths Yet</h3>
              <p className="mb-4 text-center text-sm text-muted-foreground">
                Create your first personalized learning path to get started
              </p>
              <Link href="/pre-test">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <IconPlus className="mr-2 size-4" />
                  Create Your First Path
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          paths.map((path) => (
            <Card key={path.id} className="flex flex-col overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg leading-tight">{path.title}</CardTitle>
                      <Badge className={`shrink-0 ${getStatusColor(path.status)}`}>{path.status}</Badge>
                    </div>
                    <CardDescription className="line-clamp-2 text-xs">{path.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col gap-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">Progress</span>
                    <span className="text-muted-foreground">{path.progress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full bg-blue-600 transition-all"
                      style={{ width: `${path.progress}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <IconBook className="size-3.5" />
                    <span>{path.completedCourses}/{path.totalCourses}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IconClock className="size-3.5" />
                    <span>{path.timeSpent}</span>
                  </div>
                </div>

                {/* Courses List */}
                <div className="mt-auto space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Recent Courses</p>
                  <div className="max-h-[160px] space-y-2 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                    {path.courses.map((course: any, index: number) => (
                      <div
                        key={index}
                        role="button"
                        onClick={() => {
                          // If course is active, go to it. If not, go to courses page to start it (or start directly?)
                          // Simpler: Redirect to courses page for generation, or if active, to details.
                          if (course.isActive) router.push(`/courses/${course._id}`)
                          else router.push('/courses')
                        }}
                        className="flex items-center justify-between gap-2 rounded-md border p-2 text-xs transition-colors hover:bg-slate-50 cursor-pointer"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="shrink-0">{getCourseStatusIcon(course.status)}</div>
                          <p className="truncate font-medium">{course.title}</p>
                        </div>
                        <span className="shrink-0 text-muted-foreground">{course.progress}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="sm"
                  onClick={() => router.push(`/courses?planId=${path.id}`)}
                >
                  <IconPlayerPlay className="mr-2 size-4" />
                  Continue Learning
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
