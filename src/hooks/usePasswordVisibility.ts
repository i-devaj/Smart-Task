"use client"

import { useState } from "react"

export function usePasswordVisibility(initial = false) {
  const [visible, setVisible] = useState(initial)

  const toggle = () => setVisible((prev) => !prev)

  return {
    visible,
    toggle,
  }
}


