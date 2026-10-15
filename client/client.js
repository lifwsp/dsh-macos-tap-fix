/**
 * dsh-macos-tap-fix — client bundle.
 *
 * Workaround for WebKit Bug 219670 (https://bugs.webkit.org/show_bug.cgi?id=219670),
 * fix proposed in https://github.com/WebKit/WebKit/pull/76581.
 *
 * Symptom: on macOS, with an input method active and an editable element
 * focused, a trackpad Tap-to-Click can deliver `mouseup` BEFORE `mousedown`.
 * The first click is then lost and the user has to click a second time.
 *
 * Workaround: when a `mouseup` arrives with no preceding `mousedown`, wait a
 * moment; if no `click` reached the same element, dispatch one ourselves. The
 * late `mousedown` that follows is ignored.
 *
 * It only acts when the event order is actually broken, so normal clicks are
 * untouched. Remove this plugin from the profile once WebKit ships the fix.
 */
window.__ModuleLoader__.load({
  id: 'dsh-macos-tap-fix',
  factory: () => {
    /** How long to wait for a native click before synthesizing one. */
    const WAIT_MS = 40
    /** How long a stray `mousedown` is still considered "late" for a fixed tap. */
    const LATE_WINDOW_MS = 300

    const isMac = /Mac/i.test(navigator.platform || navigator.userAgent || '')

    function install() {
      let downSeen = false
      let lateDowns = 0
      let lateTimer = 0

      const onDown = (event) => {
        if (lateDowns > 0) { lateDowns -= 1; return }
        if (event.button !== 0) return
        downSeen = true
      }

      const onUp = (event) => {
        if (event.button !== 0) return
        if (downSeen) { downSeen = false; return }
        // `mouseup` without a preceding `mousedown`: order was reversed.
        lateDowns += 1
        clearTimeout(lateTimer)
        lateTimer = setTimeout(() => { lateDowns = 0 }, LATE_WINDOW_MS)

        const target = event.target
        if (!(target instanceof Element)) return
        let clicked = false
        const watch = (e) => { if (e.target === target || target.contains(e.target)) clicked = true }
        window.addEventListener('click', watch, true)
        setTimeout(() => {
          window.removeEventListener('click', watch, true)
          if (!clicked && target.isConnected && typeof target.click === 'function') target.click()
        }, WAIT_MS)
      }

      window.addEventListener('mousedown', onDown, true)
      window.addEventListener('mouseup', onUp, true)
      return () => {
        clearTimeout(lateTimer)
        window.removeEventListener('mousedown', onDown, true)
        window.removeEventListener('mouseup', onUp, true)
      }
    }

    function apply(ctx) {
      if (!isMac) return
      ctx.effect(install, 'dsh-macos-tap-fix: mouse event order workaround')
    }

    return { name: 'dsh-macos-tap-fix', inject: [], apply }
  },
})
