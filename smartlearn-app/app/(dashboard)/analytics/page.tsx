export default function AnalyticsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Progress Analytics</h1>
      </div>
      <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <p className="text-muted-foreground">
          Your learning analytics and progress reports will appear here.
        </p>
      </div>
    </div>
  )
}
