"use client"

import { useId } from "react"
import { Editor } from "@monaco-editor/react"

type CodeEditorProps = {
  value: string
  onChange: (value: string) => void
  language?: string
  height?: string
}

export function CodeEditor({
  value,
  onChange,
  language = "typescript",
  height = "260px",
}: CodeEditorProps) {
  const id = useId()

  return (
    <div className="rounded-md border border-border/60 bg-background/60">
      <Editor
        key={id}
        height={height}
        language={language}
        theme="vs-dark"
        value={value}
        onChange={(nextValue) => onChange(nextValue ?? "")}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          scrollBeyondLastLine: false,
          wordWrap: "on",
          automaticLayout: true,
        }}
      />
    </div>
  )
}


