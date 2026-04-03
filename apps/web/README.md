# Web App

This is the current browser-first version of the project.

## Stack

- Vite
- React
- Bun
- reusable design system
- reusable Clerk auth package
- in-browser face detection and masking

## Run

```powershell
bun install
bun run dev
```

## Build

```powershell
bun run build
```

## Notes

- Face masking runs fully in the browser.
- The app retries detection across multiple browser-side passes and scales before giving up.
- If auto-detect misses, you can drag over the face on the original preview to add a manual fallback.
- Text rectangles auto-size from the text content and can be dragged on the rendered preview.
