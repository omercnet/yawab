import { useEffect, useRef } from 'react'

/**
 * Attaches an IntersectionObserver to a container ref and adds
 * the "in-view" class to every child with class "reveal" when it
 * enters the viewport. Respects prefers-reduced-motion.
 */
export function useReveal<T extends HTMLElement>(threshold = 0.12) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const nodes = Array.from(el.querySelectorAll<HTMLElement>('.reveal'))

    if (prefersReduced) {
      for (const node of nodes) {
        node.classList.add('in-view')
      }
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view')
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold }
    )

    for (const node of nodes) {
      observer.observe(node)
    }

    return () => observer.disconnect()
  }, [threshold])

  return ref
}
