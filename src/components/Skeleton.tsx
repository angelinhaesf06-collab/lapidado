import React from 'react'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-brand-secondary/5 rounded-2xl ${className}`} />
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-white p-6 rounded-[40px] border border-brand-secondary/5 shadow-sm space-y-4">
      <div className="flex justify-between">
        <Skeleton className="w-12 h-12 rounded-2xl" />
        <Skeleton className="w-20 h-6 rounded-full" />
      </div>
      <Skeleton className="w-3/4 h-4" />
      <Skeleton className="w-1/2 h-8" />
      <div className="pt-4 border-t border-brand-secondary/5 flex justify-between">
        <Skeleton className="w-20 h-4" />
        <Skeleton className="w-20 h-4" />
      </div>
    </div>
  )
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-brand-secondary/5">
      <Skeleton className="w-12 h-12 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="w-1/3 h-4" />
        <Skeleton className="w-1/4 h-3" />
      </div>
      <Skeleton className="w-24 h-8 rounded-full" />
    </div>
  )
}

export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="bg-white rounded-[40px] border border-brand-secondary/5 overflow-hidden shadow-sm space-y-3 p-4">
          <Skeleton className="aspect-square w-full rounded-3xl" />
          <Skeleton className="w-3/4 h-4" />
          <Skeleton className="w-1/2 h-6" />
        </div>
      ))}
    </div>
  )
}
