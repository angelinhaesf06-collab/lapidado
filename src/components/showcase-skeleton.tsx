import React from 'react';

export default function ShowcaseSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 md:gap-x-10 gap-y-10 md:gap-y-20 px-1 animate-pulse">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex flex-col items-center">
          <div className="aspect-[4/5] w-full bg-brand-secondary/5 rounded-[40px] md:rounded-[64px] mb-6 md:mb-10 shadow-sm" />
          <div className="w-24 h-2 bg-brand-secondary/10 rounded mb-2" />
          <div className="w-16 h-4 bg-brand-secondary/5 rounded" />
        </div>
      ))}
    </div>
  );
}
