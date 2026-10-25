import { useEffect, useRef, useState } from 'react'

/** True while the element is on (or near) screen. Used to pause WebGL loops offscreen. */
export function useInView<T extends HTMLElement>(rootMargin = '120px') {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(true)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin })
    io.observe(el)
    return () => io.disconnect()
  }, [rootMargin])
  return { ref, inView }
}
