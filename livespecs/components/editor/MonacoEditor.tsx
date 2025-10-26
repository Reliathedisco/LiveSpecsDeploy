"use client"

import dynamic from "next/dynamic"
import { useMemo, useRef, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import type { editor } from "monaco-editor"
import type { OnMount } from "@monaco-editor/react"

const Monaco = dynamic(() => import("@monaco-editor/react"), { ssr: false })

interface MonacoEditorProps {
  value: string
  onChange: (value: string) => void
  language?: "yaml" | "json"
  readOnly?: boolean
}

export function MonacoEditor({ value, onChange, language = "yaml", readOnly = false }: MonacoEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const [isReady, setIsReady] = useState(false)

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    setIsReady(true)
  }

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value)
    }
  }

  const options = useMemo(
    () => ({
      minimap: { enabled: false },
      fontSize: 13,
      lineNumbers: "on" as const,
      rulers: [],
      wordWrap: "on" as const,
      smoothScrolling: true,
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      readOnly,
      scrollbar: {
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10,
      },
    }),
    [readOnly],
  )

  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const onChangeDebounced = (val: string | undefined) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (val !== undefined) onChange(val)
    }, 200)
  }

  return (
    <div className="h-full w-full">
      <Monaco
        height="100%"
        language={language}
        value={value}
        onChange={onChangeDebounced}
        onMount={handleEditorDidMount}
        options={options}
        theme="vs-dark"
        loading={<Skeleton className="h-full w-full" />}
      />
    </div>
  )
}
