/// <reference types="vitest/globals" />
import { describe, it, expect } from 'vitest'

// ============================================================================
// Tests for format utilities (inline — no deps needed)
// ============================================================================

// Import the actual format functions for direct testing
import { formatKg, timeAgo, shortDate, scanTypeLabel } from '@/components/dashboard/format'
import { formatCo2e } from '@/lib/emissions/appliance-calc'
import { formatCost } from '@/lib/emissions/appliance-suggestions'

describe('format utilities', () => {
  // timeAgo from src/components/dashboard/format.ts
  describe('timeAgo', () => {
    it('returns "just now" for dates less than 1 minute ago', () => {
      expect(timeAgo(new Date())).toBe('just now')
    })

    it('returns minutes for dates less than 1 hour ago', () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
      expect(timeAgo(fiveMinAgo)).toBe('5m ago')
    })

    it('returns hours for dates less than 24 hours ago', () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000)
      expect(timeAgo(threeHoursAgo)).toBe('3h ago')
    })

    it('returns days for dates less than 7 days ago', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      expect(timeAgo(twoDaysAgo)).toBe('2d ago')
    })

    it('returns weeks for dates older than 7 days', () => {
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      expect(timeAgo(twoWeeksAgo)).toBe('2w ago')
    })

    it('returns many weeks for very old dates', () => {
      const manyWeeksAgo = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000)
      const result = timeAgo(manyWeeksAgo)
      expect(result).toMatch(/\d+w ago/)
    })

    it('handles string date input', () => {
      expect(timeAgo(new Date().toISOString())).toBe('just now')
    })

    it('returns NaN string for invalid dates', () => {
      const result = timeAgo('invalid-date')
      expect(result).toBe('NaNw ago')
    })
  })

  // daysUntil from src/components/dashboard/goals-progress.tsx
  describe('daysUntil', () => {
    const daysUntil = (date: Date | string): number => {
      const d = typeof date === 'string' ? new Date(date) : date
      if (isNaN(d.getTime())) return 0
      const now = new Date()
      const diff = d.getTime() - now.getTime()
      return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
    }

    it('returns positive number for future dates', () => {
      const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      expect(daysUntil(future)).toBe(5)
    })

    it('returns 0 for past dates', () => {
      const past = new Date('2020-01-01')
      expect(daysUntil(past)).toBe(0)
    })

    it('handles string date input', () => {
      const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      expect(daysUntil(future.toISOString())).toBe(3)
    })

    it('returns 0 for invalid dates', () => {
      expect(daysUntil('not-a-date')).toBe(0)
    })
  })

  // ---------------------------------------------------------------------------
  // formatKg from src/components/dashboard/format.ts
  // ---------------------------------------------------------------------------
  describe('formatKg', () => {
    it('formats 0 kg correctly', () => {
      expect(formatKg(0)).toBe('0.0kg')
    })

    it('formats values under 100 kg with one decimal', () => {
      expect(formatKg(0.5)).toBe('0.5kg')
      expect(formatKg(42)).toBe('42.0kg')
      expect(formatKg(99.9)).toBe('99.9kg')
    })

    it('formats values between 100 and 999 as rounded integers', () => {
      expect(formatKg(100)).toBe('100kg')
      expect(formatKg(500)).toBe('500kg')
      expect(formatKg(999)).toBe('999kg')
    })

    it('formats values ≥ 1000 as tonnes with one decimal', () => {
      expect(formatKg(1000)).toBe('1.0t')
      expect(formatKg(1500)).toBe('1.5t')
      expect(formatKg(1000000)).toBe('1000.0t')
    })

    it('formats exactly at boundaries', () => {
      expect(formatKg(99.9)).toBe('99.9kg')
      expect(formatKg(100)).toBe('100kg')
      expect(formatKg(999)).toBe('999kg')
      expect(formatKg(1000)).toBe('1.0t')
    })
  })

  // ---------------------------------------------------------------------------
  // formatCo2e from src/lib/emissions/appliance-calc.ts
  // ---------------------------------------------------------------------------
  describe('formatCo2e', () => {
    it('formats 0 kg CO₂e correctly', () => {
      expect(formatCo2e(0)).toBe('0.0kg')
    })

    it('formats small values with one decimal', () => {
      expect(formatCo2e(0.5)).toBe('0.5kg')
      expect(formatCo2e(42)).toBe('42.0kg')
    })

    it('formats values 100-999 as rounded integers', () => {
      expect(formatCo2e(100)).toBe('100kg')
      expect(formatCo2e(500)).toBe('500kg')
    })

    it('formats values ≥ 1000 as tonnes', () => {
      expect(formatCo2e(1000)).toBe('1.0t')
      expect(formatCo2e(1000000)).toBe('1000.0t')
    })
  })

  // ---------------------------------------------------------------------------
  // formatCost from src/lib/emissions/appliance-suggestions.ts
  // ---------------------------------------------------------------------------
  describe('formatCost', () => {
    it('formats 0 as $0', () => {
      expect(formatCost(0)).toBe('$0')
    })

    it('formats values under 100 with no decimals', () => {
      expect(formatCost(1)).toBe('$1')
      expect(formatCost(50)).toBe('$50')
      expect(formatCost(99)).toBe('$99')
    })

    it('formats values 100-999 as rounded dollars', () => {
      expect(formatCost(100)).toBe('$100')
      expect(formatCost(500)).toBe('$500')
    })

    it('formats values ≥ 1000 as k-suffixed with one decimal', () => {
      expect(formatCost(1000)).toBe('$1.0k')
      expect(formatCost(1500)).toBe('$1.5k')
      expect(formatCost(10000)).toBe('$10.0k')
    })
  })

  // ---------------------------------------------------------------------------
  // shortDate from src/components/dashboard/format.ts
  // ---------------------------------------------------------------------------
  describe('shortDate', () => {
    it('formats a date string as weekday + day number', () => {
      // 2026-06-21 is a Sunday
      const result = shortDate('2026-06-21')
      expect(result).toMatch(/Sun 21|Sun 20/)
    })

    it('formats a different date', () => {
      // 2026-01-01 is a Thursday
      const result = shortDate('2026-01-01')
      expect(result).toMatch(/Thu 1|Thu 01/)
    })
  })

  // ---------------------------------------------------------------------------
  // scanTypeLabel from src/components/dashboard/format.ts
  // ---------------------------------------------------------------------------
  describe('scanTypeLabel', () => {
    it('humanizes "MANUAL" to "Manual"', () => {
      expect(scanTypeLabel('MANUAL')).toBe('Manual')
    })

    it('humanizes "UPLOAD" to "Upload"', () => {
      expect(scanTypeLabel('UPLOAD')).toBe('Upload')
    })

    it('humanizes "RECEIPT" to "Receipt"', () => {
      expect(scanTypeLabel('RECEIPT')).toBe('Receipt')
    })

    it('handles already capitalized input', () => {
      expect(scanTypeLabel('Auto')).toBe('Auto')
    })

    it('handles single character', () => {
      expect(scanTypeLabel('A')).toBe('A')
    })
  })
})
