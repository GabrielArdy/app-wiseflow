import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"

async function prepare() {
  if (import.meta.env.VITE_MOCK === "true") {
    const { worker } = await import("@/mocks/browser")
    await worker.start({ onUnhandledRequest: "bypass" })
    console.info("[MSW] Mock API active")
  }
}

void prepare().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
})
