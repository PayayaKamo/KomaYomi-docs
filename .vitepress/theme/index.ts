import DefaultTheme from 'vitepress/theme'
import { inBrowser } from 'vitepress'
import Layout from './Layout.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp() {
    if (!inBrowser) return

    // Open external links in a new tab without leaking the referrer or
    // giving the new page access to window.opener.
    window.addEventListener('click', (event) => {
      if (event.defaultPrevented) return
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return
      }
      const target = event.target as HTMLElement | null
      const anchor = target?.closest?.('a') as HTMLAnchorElement | null
      if (!anchor) return
      const href = anchor.getAttribute('href') || ''
      if (!/^https?:\/\//i.test(href)) return
      let url: URL
      try {
        url = new URL(href)
      } catch {
        return
      }
      if (url.origin === window.location.origin) return
      event.preventDefault()
      window.open(url.href, '_blank', 'noopener,noreferrer')
    })
  },
}
