# dsh-macos-tap-fix

A small workaround plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (dsh / dsh-tauri) on macOS.

> **Temporary.** Remove it once the WebKit fix ships.

## Symptom

On macOS, with an input method (e.g. Japanese, Chinese) active and an editable element focused (such as the chat input), the first **Tap-to-Click** on a button does nothing; a second tap is needed. Pressing the trackpad down, or using Firefox, works.

## Cause

WebKit Bug [219670](https://bugs.webkit.org/show_bug.cgi?id=219670): the tap's `mouseup` can be delivered **before** its `mousedown`, so the `click` is lost. A fix is proposed in [WebKit/WebKit#76581](https://github.com/WebKit/WebKit/pull/76581). It affects Safari and WKWebView apps, including dsh-tauri.

## What this plugin does

Browser-side only, macOS only. When a `mouseup` arrives with no preceding `mousedown`, it waits 40 ms; if no `click` reached that element, it dispatches one, and ignores the late `mousedown`. Normal clicks are untouched.

## Install

In your dsh profile's `package.json`, add the dependency and the bundle, then restart the app:

```json
"dependencies": { "dsh-macos-tap-fix": "github:lifwsp/dsh-macos-tap-fix" },
"dsh": { "profile": { "bundles": ["dsh-macos-tap-fix"] } }
```

To remove: delete both entries and restart.

## Caveats

- It infers broken event order and synthesizes a click, so edge cases are possible. Use at your own risk.
- Only verified by hand on macOS 26.5.1 with Google Japanese Input.
- Plugins reload only after restarting the app.

MIT License
