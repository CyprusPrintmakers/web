/** Pause the publish webhook while a bulk write runs, then restore it. */

type Hook = { id: string; name: string }

const HOOK_NAME = 'Vercel rebuild'

async function listHooks(projectId: string, token: string): Promise<Hook[]> {
  const response = await fetch(
    `https://api.sanity.io/v2025-02-19/hooks/projects/${projectId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  if (!response.ok) throw new Error(`hooks list failed: ${response.status}`)
  return (await response.json()) as Hook[]
}

async function setHookDisabled(
  projectId: string,
  token: string,
  id: string,
  disabled: boolean,
): Promise<void> {
  const response = await fetch(
    `https://api.sanity.io/v2025-02-19/hooks/projects/${projectId}/${id}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isDisabledByUser: disabled }),
    },
  )
  if (!response.ok) throw new Error(`hook patch failed: ${response.status}`)
}

export async function withWebhookPaused<T>(
  projectId: string,
  token: string,
  run: () => Promise<T>,
): Promise<T> {
  const hook = (await listHooks(projectId, token)).find(entry => entry.name === HOOK_NAME)
  if (hook) {
    await setHookDisabled(projectId, token, hook.id, true)
    console.log('webhook disabled during import')
  }

  try {
    return await run()
  } finally {
    if (hook) {
      await setHookDisabled(projectId, token, hook.id, false)
      console.log('webhook re-enabled')
    }
  }
}
