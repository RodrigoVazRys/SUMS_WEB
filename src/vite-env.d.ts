/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_OCR_API_URL: string
  readonly VITE_OCR_API_KEY: string
  readonly VITE_SESSION_TIMEOUT: string
  readonly VITE_STORAGE_URL: string
  readonly VITE_UNIT_NAME: string
  readonly VITE_UNIT_CLUES: string
  readonly VITE_DEMO_MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
