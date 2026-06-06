import { cn } from "@/lib/utils"

interface TableContainerProps {
  maxHeight?: string
  className?: string
  children: React.ReactNode
}

export function TableContainer({
  maxHeight = "calc(100vh - 220px)",
  className,
  children,
}: TableContainerProps) {
  return (
    <div className={cn("rounded-lg border border-border/50 overflow-hidden", className)}>
      <div
        className="overflow-x-auto overflow-y-auto"
        style={{ maxHeight }}
      >
        {children}
      </div>
    </div>
  )
}
