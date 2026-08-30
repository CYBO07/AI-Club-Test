import React from "react";

export function SkeletonLine({ className = "" }) {
  return <div className={`skeleton h-4 ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="card p-5 space-y-3">
      <SkeletonLine className="w-1/3" />
      <SkeletonLine className="w-1/2 h-8" />
    </div>
  );
}

export function SkeletonTableRows({ rows = 5, cols = 6 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: cols }).map((__, c) => (
            <td key={c} className="p-3.5"><SkeletonLine className={c === 0 ? "w-32" : "w-16"} /></td>
          ))}
        </tr>
      ))}
    </>
  );
}
