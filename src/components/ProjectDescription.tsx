"use client";

import { useState } from "react";

export default function ProjectDescription({ text }: { text: string | null }) {
  const [expanded, setExpanded] = useState(false);

  if (!text) return null;

  const isLong = text.length > 150;
  const display = isLong && !expanded ? text.slice(0, 150) + "..." : text;

  return (
    <p className="mt-1 max-w-2xl text-sm text-slate-500">
      {display}
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="ml-1.5 text-indigo-500 hover:text-indigo-600"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </p>
  );
}
