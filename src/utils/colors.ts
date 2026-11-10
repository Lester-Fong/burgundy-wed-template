import type { HexColor } from '../types/wedding'

/** Reject CSS functions and malformed tokens before exposing a palette value as a custom property. */
export function safeHexColor(value: unknown, fallback: HexColor = '#8D7768'): HexColor {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? (value as HexColor) : fallback
}
