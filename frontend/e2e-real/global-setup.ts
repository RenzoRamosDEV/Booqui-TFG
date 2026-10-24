import type { FullConfig } from '@playwright/test'

const POLL_INTERVAL_MS = 5_000
const DEFAULT_TIMEOUT_MS = 600_000
const START_COMMAND =
  'docker compose -f infra/docker/docker-compose.yml -f infra/docker/docker-compose.override.yml --env-file infra/.env up -d --build'

async function answersOk(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(POLL_INTERVAL_MS) })
    return response.status === 200
  } catch {
    return false
  }
}

export default async function waitForBackend(config: FullConfig) {
  const baseURL = String(config.projects[0]?.use.baseURL)
  const timeoutMs = Number(process.env.E2E_REAL_READY_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS)
  const deadline = Date.now() + timeoutMs

  while (!(await answersOk(`${baseURL}/api/v1/events`))) {
    const remaining = deadline - Date.now()
    if (remaining <= 0) {
      throw new Error(
        `Backend not ready at ${baseURL} after ${timeoutMs} ms. Start it with: ${START_COMMAND}`,
      )
    }
    await new Promise((resolve) => setTimeout(resolve, Math.min(POLL_INTERVAL_MS, remaining)))
  }
}
