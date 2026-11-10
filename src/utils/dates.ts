export interface CountdownParts {
  days: number
  hours: number
  minutes: number
  seconds: number
  complete: boolean
}

export function formatInvitationDate(isoDate: string): string {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate)
  return parts ? `${parts[2]} · ${parts[3]} · ${parts[1].slice(-2)}` : isoDate
}

export function countdownTo(isoDate: string, now = Date.now()): CountdownParts {
  const target = Date.parse(isoDate)
  if (!Number.isFinite(target)) return { days: 0, hours: 0, minutes: 0, seconds: 0, complete: true }
  const remaining = Math.max(0, target - now)
  const totalSeconds = Math.floor(remaining / 1000)
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    complete: remaining === 0,
  }
}
