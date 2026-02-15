"use client"

import { useEffect, useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, Area, AreaChart } from "recharts"
import {
  IconBook,
  IconClipboardCheck,
  IconFileText,
  IconLoader2,
  IconTarget,
  IconChartBar,
} from "@tabler/icons-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { IconCalendar } from "@tabler/icons-react"
import { format } from "date-fns"

type ApiResponse<T> = {
  success?: boolean
  data?: T
  message?: string
}

export default function DashboardPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [summaries, setSummaries] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [fromDate, setFromDate] = useState<Date>(() => {
    const date = new Date()
    date.setDate(date.getDate() - 7)
    return date
  })
  const [toDate, setToDate] = useState<Date>(new Date())

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true)
        setError(null)
        const token = localStorage.getItem("token")
        if (!token) {
          setLoading(false)
          return
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8008"
        const headers = { Authorization: `Bearer ${token}` }

        const [coursesRes, quizzesRes, summariesRes, plansRes] = await Promise.all([
          fetch(`${apiUrl}/api/courses`, { headers }),
          fetch(`${apiUrl}/api/quizzes`, { headers }),
          fetch(`${apiUrl}/api/summaries`, { headers }),
          fetch(`${apiUrl}/api/study-plans`, { headers }),
        ])

        const [coursesData, quizzesData, summariesData, plansData]: [
          ApiResponse<any[]>,
          ApiResponse<any[]>,
          ApiResponse<any[]>,
          ApiResponse<any[]>
        ] = await Promise.all([
          coursesRes.json(),
          quizzesRes.json(),
          summariesRes.json(),
          plansRes.json(),
        ])

        if (coursesData.success) setCourses(coursesData.data || [])
        if (quizzesData.success) setQuizzes(quizzesData.data || [])
        if (summariesData.success) setSummaries(summariesData.data || [])
        if (plansData.success) setPlans(plansData.data || [])

        setLastUpdated(new Date().toISOString())
      } catch (fetchError) {
        console.error("Failed to fetch dashboard stats", fetchError)
        setError("Unable to load dashboard statistics.")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardStats()
  }, [])

  const {
    courseStats,
    quizStats,
    summaryStats,
    pathStats,
    weeklyActivity,
  } = useMemo(() => {
    const totalCourses = courses.length
    const completedCourses = courses.filter((course) => (course.progress ?? 0) >= 100).length
    const inProgressCourses = courses.filter(
      (course) => (course.progress ?? 0) > 0 && (course.progress ?? 0) < 100
    ).length
    const avgCourseProgress = totalCourses
      ? Math.round(courses.reduce((sum, course) => sum + (course.progress || 0), 0) / totalCourses)
      : 0

    const totalQuizzes = quizzes.length
    const completedQuizzes = quizzes.filter((quiz) => quiz.status === "completed").length
    const inProgressQuizzes = quizzes.filter((quiz) => quiz.status === "in-progress").length
    const avgQuizScore = completedQuizzes
      ? Math.round(
        quizzes
          .filter((quiz) => quiz.status === "completed")
          .reduce((sum, quiz) => sum + (quiz.score || 0), 0) / completedQuizzes
      )
      : 0
    const totalQuestions = quizzes.reduce((sum, quiz) => sum + (quiz.questions?.length || 0), 0)

    const totalSummaries = summaries.length
    const totalSummaryWords = summaries.reduce((sum, summary) => sum + (summary.wordCount || 0), 0)
    const avgSummaryWords = totalSummaries ? Math.round(totalSummaryWords / totalSummaries) : 0

    const pathProgress = plans.map((plan) => {
      const content = plan.generatedContent || {}
      const planCourses = content.courses || []
      if (!planCourses.length) return 0
      const mergedProgress = planCourses.reduce((sum: number, course: any) => {
        const activeCourse = courses.find((active) => active.title === course.title)
        return sum + (activeCourse?.progress ?? 0)
      }, 0)
      return Math.round(mergedProgress / planCourses.length)
    })

    const totalPaths = plans.length
    const completedPaths = pathProgress.filter((progress) => progress >= 100).length
    const avgPathProgress = totalPaths
      ? Math.round(pathProgress.reduce((sum, progress) => sum + progress, 0) / totalPaths)
      : 0

    const now = new Date()
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(now.getDate() - 7)

    const withinWeek = (date?: string) => {
      if (!date) return false
      const parsed = new Date(date)
      return parsed >= oneWeekAgo
    }

    const weeklyActivity = {
      courses: courses.filter((course) => withinWeek(course.createdAt)).length,
      quizzes: quizzes.filter((quiz) => withinWeek(quiz.createdAt)).length,
      summaries: summaries.filter((summary) => withinWeek(summary.createdAt)).length,
      paths: plans.filter((plan) => withinWeek(plan.startDate || plan.createdAt)).length,
    }

    const buildActivitySeries = (daysCount: number) => {
      const today = new Date()
      const days = Array.from({ length: daysCount }, (_, index) => {
        const date = new Date(today)
        date.setDate(date.getDate() - (daysCount - 1 - index))
        const key = date.toISOString().split("T")[0]
        return {
          key,
          label: date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          courses: 0,
          quizzes: 0,
          summaries: 0,
          paths: 0,
        }
      })

      const indexByKey = new Map(days.map((day) => [day.key, day]))

      const addItems = (
        items: any[],
        dateKey: string,
        target: "courses" | "quizzes" | "summaries" | "paths"
      ) => {
        items.forEach((item) => {
          const value = item?.[dateKey]
          if (!value) return
          const key = new Date(value).toISOString().split("T")[0]
          const entry = indexByKey.get(key)
          if (entry) {
            entry[target] += 1
          }
        })
      }

      addItems(courses, "createdAt", "courses")
      addItems(quizzes, "createdAt", "quizzes")
      addItems(summaries, "createdAt", "summaries")
      addItems(plans, "startDate", "paths")
      addItems(plans, "createdAt", "paths")

      return days
    }

    return {
      courseStats: {
        totalCourses,
        completedCourses,
        inProgressCourses,
        avgCourseProgress,
      },
      quizStats: {
        totalQuizzes,
        completedQuizzes,
        inProgressQuizzes,
        avgQuizScore,
        totalQuestions,
      },
      summaryStats: {
        totalSummaries,
        totalSummaryWords,
        avgSummaryWords,
      },
      pathStats: {
        totalPaths,
        completedPaths,
        avgPathProgress,
      },
      weeklyActivity,
    }
  }, [courses, quizzes, summaries, plans])

  const activitySeries = useMemo(() => {
    const start = new Date(fromDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(toDate)
    end.setHours(23, 59, 59, 999)
    
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    const days = Array.from({ length: daysDiff }, (_, index) => {
      const date = new Date(start)
      date.setDate(start.getDate() + index)
      const key = date.toISOString().split("T")[0]
      return {
        key,
        label: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        courses: 0,
        quizzes: 0,
        summaries: 0,
        paths: 0,
      }
    })

    const indexByKey = new Map(days.map((day) => [day.key, day]))

    const addItems = (
      items: any[],
      dateKey: string,
      target: "courses" | "quizzes" | "summaries" | "paths"
    ) => {
      items.forEach((item) => {
        const value = item?.[dateKey]
        if (!value) return
        const itemDate = new Date(value)
        if (itemDate >= start && itemDate <= end) {
          const key = itemDate.toISOString().split("T")[0]
          const entry = indexByKey.get(key)
          if (entry) {
            entry[target] += 1
          }
        }
      })
    }

    addItems(courses, "createdAt", "courses")
    addItems(quizzes, "createdAt", "quizzes")
    addItems(summaries, "createdAt", "summaries")
    addItems(plans, "startDate", "paths")
    addItems(plans, "createdAt", "paths")

    return days
  }, [courses, quizzes, summaries, plans, fromDate, toDate])

  const chartConfig = {
    courses: { label: "Courses", color: "var(--color-chart-1)" },
    quizzes: { label: "Quizzes", color: "var(--color-chart-2)" },
    summaries: { label: "Summaries", color: "var(--color-chart-3)" },
    paths: { label: "Learning Paths", color: "var(--color-chart-4)" },
  } satisfies ChartConfig

  const statCards = [
    {
      label: "Total Courses",
      value: courseStats.totalCourses,
      helper: `${courseStats.inProgressCourses} in progress`,
      icon: IconBook,
      gradient: "from-blue-500 to-blue-600",
      bgColor: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900",
      iconColor: "text-blue-600 dark:text-blue-400",
      textColor: "text-blue-900 dark:text-blue-100",
    },
    {
      label: "Completed Courses",
      value: courseStats.completedCourses,
      helper: `${courseStats.totalCourses - courseStats.completedCourses} remaining`,
      icon: IconClipboardCheck,
      gradient: "from-green-500 to-emerald-600",
      bgColor: "bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900",
      iconColor: "text-green-600 dark:text-green-400",
      textColor: "text-green-900 dark:text-green-100",
    },
    {
      label: "Learning Paths",
      value: pathStats.totalPaths,
      helper: `${pathStats.completedPaths} completed`,
      icon: IconTarget,
      gradient: "from-purple-500 to-purple-600",
      bgColor: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900",
      iconColor: "text-purple-600 dark:text-purple-400",
      textColor: "text-purple-900 dark:text-purple-100",
    },
    {
      label: "Avg Course Progress",
      value: `${courseStats.avgCourseProgress}%`,
      helper: "Across all courses",
      icon: IconChartBar,
      gradient: "from-orange-500 to-orange-600",
      bgColor: "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900",
      iconColor: "text-orange-600 dark:text-orange-400",
      textColor: "text-orange-900 dark:text-orange-100",
    },
    {
      label: "Total Quizzes",
      value: quizStats.totalQuizzes,
      helper: `${quizStats.completedQuizzes} completed`,
      icon: IconClipboardCheck,
      gradient: "from-cyan-500 to-cyan-600",
      bgColor: "bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950 dark:to-cyan-900",
      iconColor: "text-cyan-600 dark:text-cyan-400",
      textColor: "text-cyan-900 dark:text-cyan-100",
    },
    {
      label: "Avg Quiz Score",
      value: `${quizStats.avgQuizScore}%`,
      helper: quizStats.completedQuizzes ? "Completed quizzes only" : "No completed quizzes",
      icon: IconChartBar,
      gradient: "from-indigo-500 to-indigo-600",
      bgColor: "bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      textColor: "text-indigo-900 dark:text-indigo-100",
    },
    {
      label: "Summaries",
      value: summaryStats.totalSummaries,
      helper: `${summaryStats.totalSummaryWords.toLocaleString()} words`,
      icon: IconFileText,
      gradient: "from-pink-500 to-pink-600",
      bgColor: "bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900",
      iconColor: "text-pink-600 dark:text-pink-400",
      textColor: "text-pink-900 dark:text-pink-100",
    },
    {
      label: "Avg Summary Length",
      value: `${summaryStats.avgSummaryWords.toLocaleString()} words`,
      helper: "Per summary",
      icon: IconFileText,
      gradient: "from-teal-500 to-teal-600",
      bgColor: "bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900",
      iconColor: "text-teal-600 dark:text-teal-400",
      textColor: "text-teal-900 dark:text-teal-100",
    },
  ]

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            A full snapshot of your learning activity and progress.
          </p>
        </div>
        {lastUpdated && (
          <span className="text-xs text-muted-foreground">
            Updated {new Date(lastUpdated).toLocaleTimeString()}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-lg border bg-card p-10 text-muted-foreground">
          <IconLoader2 className="animate-spin" />
          Loading dashboard statistics...
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
          {error}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => (
              <Card key={stat.label} className={`${stat.bgColor} border-0 shadow-sm`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardDescription className={stat.textColor}>{stat.label}</CardDescription>
                  <stat.icon className={`size-5 ${stat.iconColor}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</div>
                  <p className={`text-xs mt-1 ${stat.textColor} opacity-80`}>{stat.helper}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>Daily Activity Trend</CardTitle>
                      <CardDescription>
                        Your learning activity from {format(fromDate, "MMM d, yyyy")} to {format(toDate, "MMM d, yyyy")}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">From:</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="w-[140px] justify-start text-left font-normal">
                          <IconCalendar className="mr-2 size-4" />
                          {format(fromDate, "MMM d, yyyy")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={fromDate}
                          onSelect={(date) => date && setFromDate(date)}
                          disabled={(date) => date > toDate || date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <span className="text-sm text-muted-foreground">To:</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="w-[140px] justify-start text-left font-normal">
                          <IconCalendar className="mr-2 size-4" />
                          {format(toDate, "MMM d, yyyy")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={toDate}
                          onSelect={(date) => date && setToDate(date)}
                          disabled={(date) => date < fromDate || date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-2 pt-4 sm:px-6">
                <ChartContainer
                  config={chartConfig}
                  className="aspect-auto h-[240px] w-full"
                >
                  <AreaChart data={activitySeries}>
                    <defs>
                      <linearGradient id="fillCourses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-courses)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="var(--color-courses)" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="fillQuizzes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-quizzes)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="var(--color-quizzes)" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="fillSummaries" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-summaries)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="var(--color-summaries)" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      minTickGap={32}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Area
                      dataKey="courses"
                      type="monotone"
                      fill="url(#fillCourses)"
                      stroke="var(--color-courses)"
                      strokeWidth={2}
                      stackId="a"
                    />
                    <Area
                      dataKey="quizzes"
                      type="monotone"
                      fill="url(#fillQuizzes)"
                      stroke="var(--color-quizzes)"
                      strokeWidth={2}
                      stackId="a"
                    />
                    <Area
                      dataKey="summaries"
                      type="monotone"
                      fill="url(#fillSummaries)"
                      stroke="var(--color-summaries)"
                      strokeWidth={2}
                      stackId="a"
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
          <Card>
              <CardHeader>
                <CardTitle>This Week</CardTitle>
                <CardDescription>New items generated in the last 7 days.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Courses</span>
                  <span className="font-semibold">{weeklyActivity.courses}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Quizzes</span>
                  <span className="font-semibold">{weeklyActivity.quizzes}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Summaries</span>
                  <span className="font-semibold">{weeklyActivity.summaries}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Learning paths</span>
                  <span className="font-semibold">{weeklyActivity.paths}</span>
                </div>
                <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                  Total questions available:{" "}
                  <span className="font-semibold text-foreground">
                    {quizStats.totalQuestions.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            
          </div>
        </>
      )}
    </div>
  )
}
