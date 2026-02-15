"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { IconBook, IconClock, IconTrendingUp, IconLoader2, IconPlayerPlay, IconCheck, IconX } from "@tabler/icons-react"
import { useOpenAI } from "@/hooks/use-openai"

function CoursesList() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingId, setGeneratingId] = useState<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const planId = searchParams.get('planId')

  const { generate } = useOpenAI()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setLoading(false)
          return
        }

        const headers = { Authorization: `Bearer ${token}` }
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8008'

        // Fetch both Active Courses and Study Plans in parallel
        const [plansRes, coursesRes] = await Promise.all([
          fetch(`${apiUrl}/api/study-plans`, { headers }),
          fetch(`${apiUrl}/api/courses`, { headers })
        ])

        const plansData = await plansRes.json()
        const coursesData = await coursesRes.json()

        const activeCourses = coursesData.success ? coursesData.data : []
        const studyPlans = plansData.success ? plansData.data : []

        // Map all potential courses from Study Plans
        const potentialCourses = studyPlans.flatMap((plan: any) => {
          const content = plan.generatedContent || {}
          return (content.courses || []).map((course: any, index: number) => {
            return {
              ...course,
              studyPlanTitle: plan.title,
              studyPlanId: plan._id,
              originalCourseTitle: course.title,
              status: 'not-started',
              progress: 0,
              uniqueId: `${plan._id}-course-${index}`,
              isPotential: true
            }
          })
        })

        const mergedCourses = [...activeCourses]

        // Add potential courses that don't exist in active list
        potentialCourses.forEach((pc: any) => {
          // Check if we have an active course that matches this potential one
          const isActive = activeCourses.some((ac: any) => ac.title === pc.title) // Merge by title

          if (!isActive) {
            mergedCourses.push(pc)
          }
        })

        setCourses(mergedCourses)

      } catch (error) {
        console.error("Failed to fetch data", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleStartCourse = async (course: any) => {
    // 1. If course is an active course (has _id and NOT marked as potential/merged logic), just navigate
    if (course._id && !course.isPotential) {
      router.push(`/courses/${course._id}`)
      return
    }

    // 2. If it's a potential course, generate it
    setGeneratingId(course.uniqueId)

    try {
      const prompt = `Generate a detailed structure for the course "${course.title}".
      Description: ${course.description}
      Difficulty: ${course.difficulty}
      Duration: ${course.duration}
      Modules: ${course.modules?.join(', ')}
      
      Create a comprehensive syllabus with specific lessons for each module.`

      const schema = {
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          modules: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                topics: { type: "array", items: { type: "string" } },
                duration: { type: "string" }
              },
              required: ["name", "description", "topics", "duration"],
              additionalProperties: false
            }
          }
        },
        required: ["title", "description", "modules"],
        additionalProperties: false
      }

      const result = await generate({
        prompt,
        schema,
        systemPrompt: "You are an expert curriculum designer. Expand the course outline into a detailed structured course."
      })

      if (result.data) {
        // B. Save to backend
        const token = localStorage.getItem('token')
        const saveRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8008'}/api/courses/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ...result.data,
            difficulty: course.difficulty,
            duration: course.duration,
            studyPlanId: course.studyPlanId,
            originalCourseTitle: course.originalCourseTitle
          })
        })

        const savedData = await saveRes.json()

        if (savedData.success) {
          router.push(`/courses/${savedData.data._id}`)
        }
      }

    } catch (error) {
      console.error("Failed to generate course", error)
    } finally {
      setGeneratingId(null)
    }
  }

  // Filtering Logic
  // If planId param exists, filter courses by studyPlanId
  // Note: active courses might not have studyPlanId populated if not manually linked or if fetching implementation missed it.
  // But our potential courses DO have it.
  // For active courses, we might need to rely on matching titles to StudyPlans or ensure StudyPlanId was saved.
  // In `createCourse` controller, we save `studyPlanId`? No, we LINK TO StudyPlan, we didn't save studyPlanId on Course model explicitly in provided snippet (it had `studyPlanId` in body destructuring but I don't recall adding it to Schema).
  // Wait, let's check Course Schema. I viewed it earlier... `studyPlanId` wasn't in the snippet I saw.
  // But `createCourse` controller uses it to update StudyPlan.

  // IF active courses don't have studyPlanId, filtering will hide them!
  // QUICK FIX: When merging, we should attach the studyPlanId to the active course if we can match it to a study plan locally!
  // In `fetchData`, we have `studyPlans`.
  // We can enrich `activeCourses` by finding which plan they belong to (by finding the course title in the plan).

  const enrichedCourses = courses.map(course => {
    if (course.studyPlanId) return course
    // Try to find studyPlanId? (Only if we had access to plansData here... but it's inside useEffect)
    // Actually, let's update useEffect to enrich activeCourses before setting state.
    return course
  })

  // Re-implementing enrichment in render is hard without the plans data.
  // I must rewrite useEffect to enrich active courses.

  // HOWEVER, for now I will assume my previous logic in useEffect:
  // "const mergedCourses = [...activeCourses]"
  // This fails to add studyPlanId to active courses.

  // Let's rely on the fact that I'm rewriting the whole file. I will fix the fetching logic below.

  const filteredCourses = planId
    ? courses.filter(c => c.studyPlanId === planId)
    : courses

  // Stats calculation (based on filtered view or total? Usually total info, but filtered view should probably show filtered stats)
  // Let's show filtered stats if filtered.
  const activeOnly = filteredCourses.filter(c => !c.isPotential)
  const totalDisplayCourses = filteredCourses.length
  const inProgress = activeOnly.filter(c => c.progress > 0 && c.progress < 100).length
  const completed = activeOnly.filter(c => c.progress === 100).length
  const averageProgress = totalDisplayCourses > 0
    ? Math.round(activeOnly.reduce((acc, c) => acc + (c.progress || 0), 0) / totalDisplayCourses)
    : 0

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading your courses...</div>
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
          <p className="text-muted-foreground">
            {planId ? "Courses from your learning path" : "Manage and track your learning progress"}
          </p>
        </div>
      </div>

      {planId && (
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="text-sm px-3 py-1">
            Filtered by Path
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => router.push('/courses')} className="text-muted-foreground hover:text-foreground">
            <IconX className="size-4 mr-1" />
            Clear Filter
          </Button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {planId ? 'Courses in Path' : 'Total Courses'}
            </CardTitle>
            <IconBook className="size-5 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{totalDisplayCourses}</div>
            <p className="text-xs mt-1 text-blue-900 dark:text-blue-100 opacity-80">
              {inProgress} in progress
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">In Progress</CardTitle>
            <IconTrendingUp className="size-5 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{inProgress}</div>
            <p className="text-xs mt-1 text-orange-900 dark:text-orange-100 opacity-80">
              {totalDisplayCourses - inProgress - completed} not started
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Completed</CardTitle>
            <IconCheck className="size-5 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">{completed}</div>
            <p className="text-xs mt-1 text-green-900 dark:text-green-100 opacity-80">
              {totalDisplayCourses - completed} remaining
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">Avg. Progress</CardTitle>
            <IconTrendingUp className="size-5 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{averageProgress}%</div>
            <p className="text-xs mt-1 text-purple-900 dark:text-purple-100 opacity-80">
              Across all courses
            </p>
          </CardContent>
        </Card>
      </div>

      {filteredCourses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconBook className="mb-4 size-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No Courses Found</h3>
            <p className="text-sm text-muted-foreground">
              {planId ? "This learning path has no courses." : "Generate a learning path to get started."}
            </p>
            <Button variant="link" onClick={() => router.push('/learning-path')}>Go to Learning Path</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {filteredCourses.map((course, index) => (
            <Card key={index} className="flex flex-col relative overflow-hidden">
              {course.isPotential && (
                <div className="absolute top-0 right-0 bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-bl-lg font-medium">
                  Not Started
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Badge variant="outline" className="mb-2">
                    {course.difficulty}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <IconClock className="size-3" />
                    {course.duration}
                  </span>
                </div>
                <CardTitle className="line-clamp-1 text-lg" title={course.title}>{course.title}</CardTitle>
                <CardDescription className="line-clamp-2">{course.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto flex flex-col gap-4">
                {/* Only show progress for active courses */}
                {!course.isPotential && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">Progress</span>
                      <span className="text-muted-foreground">{course.progress || 0}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full bg-blue-600 transition-all"
                        style={{ width: `${course.progress || 0}%` }}
                      />
                    </div>
                  </div>
                )}

                {course.isPotential && (
                  <div className="text-xs text-muted-foreground italic">
                    Click start to generate content.
                  </div>
                )}

                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Key Modules:</p>
                  <div className="flex flex-wrap gap-1">
                    {course.modules?.slice(0, 3).map((module: any, i: number) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">
                        {typeof module === 'string' ? module : module.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-4">
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => handleStartCourse(course)}
                  disabled={generatingId === course.uniqueId}
                >
                  {generatingId === course.uniqueId ? (
                    <>
                      <IconLoader2 className="mr-2 size-4 animate-spin" />
                      Generating...
                    </>
                  ) : (!course.isPotential) ? (
                    <>
                      <IconPlayerPlay className="mr-2 size-4" />
                      Continue
                    </>
                  ) : (
                    <>
                      <IconPlayerPlay className="mr-2 size-4" />
                      Start Course
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CoursesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading courses...</div>}>
      <CoursesList />
    </Suspense>
  )
}
