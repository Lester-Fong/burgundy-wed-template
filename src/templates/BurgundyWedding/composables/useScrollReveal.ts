import { onBeforeUnmount, onMounted, type Ref } from 'vue'

/** Progressive enhancement: content is visible unless the observer has started successfully. */
export function useScrollReveal(root: Ref<HTMLElement | null>) {
  let observer: IntersectionObserver | undefined
  let media: MediaQueryList | undefined
  let targets: HTMLElement[] = []

  const revealAll = () => {
    observer?.disconnect()
    root.value?.classList.remove('has-scroll-reveal')
    for (const target of targets) target.dataset.reveal = 'shown'
  }

  const onMotionChange = (event: MediaQueryListEvent) => {
    if (event.matches) revealAll()
  }

  onMounted(() => {
    const container = root.value
    if (!container || !('IntersectionObserver' in window)) return

    media = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (media.matches) return

    try {
      targets = Array.from(
        container.querySelectorAll<HTMLElement>(
          '.welcome [data-welcome-reveal], ' +
            '.entourage [data-entourage-reveal], .entourage #entourage-title, ' +
            '.venues [data-venues-reveal], ' +
            '.timeline [data-timeline-reveal], ' +
            '.section__heading > .eyebrow, .section__heading > h2, .section__heading > p:last-child, ' +
            '.gifts [data-gift-reveal], ' +
            '.reminders [data-reminders-reveal], ' +
            '.faqs [data-faq-reveal], .faqs__title, ' +
            '.closing [data-closing-reveal]',
        ),
      )

      if (!targets.length) return
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue
            const element = entry.target as HTMLElement
            element.dataset.reveal = 'shown'
            observer?.unobserve(element)
          }
        },
        { threshold: 0.12, rootMargin: '0px 0px -7% 0px' },
      )

      targets.forEach((element, index) => {
        element.dataset.reveal = 'pending'
        const delay =
          element.dataset.welcomeReveal === undefined
            ? (index % 3) * 90
            : Number(element.dataset.welcomeReveal) * 85
        element.style.setProperty('--reveal-delay', `${delay}ms`)
        observer?.observe(element)
      })
      container.classList.add('has-scroll-reveal')
      media.addEventListener('change', onMotionChange)
    } catch {
      revealAll()
    }
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    media?.removeEventListener('change', onMotionChange)
  })
}
