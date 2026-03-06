import { cn } from "@/lib/utils"
import type { CSSProperties } from "react"

interface SkeletonProps {
  className?: string
  style?: CSSProperties
}

export function Skeleton({ className, style }: SkeletonProps) {
  return <div className={cn("skeleton", className)} style={style} />
}
