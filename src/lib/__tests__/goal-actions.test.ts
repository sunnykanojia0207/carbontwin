/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ============================================================================
// Tests for goal server actions.
//
// We mock Prisma (db), getServerSession, and revalidatePath at the module
// level, then test createGoal, updateGoalProgress, deleteGoal, and completeGoal.
//
// NOTE: vi.mock factory callbacks are hoisted, so mock functions must be
// created inside vi.hoisted() to be available at factory-evaluation time.
// ============================================================================

const {
  mockGoalCreate,
  mockGoalProgressCreate,
  mockGoalFindFirst,
  mockGoalUpdate,
  mockGoalProgressFindFirst,
  mockGoalProgressUpdate,
} = vi.hoisted(() => ({
  mockGoalCreate: vi.fn(),
  mockGoalProgressCreate: vi.fn(),
  mockGoalFindFirst: vi.fn(),
  mockGoalUpdate: vi.fn(),
  mockGoalProgressFindFirst: vi.fn(),
  mockGoalProgressUpdate: vi.fn(),
}))

const { mockGetServerSession } = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  db: {
    goal: {
      create: mockGoalCreate,
      findFirst: mockGoalFindFirst,
      update: mockGoalUpdate,
    },
    goalProgress: {
      create: mockGoalProgressCreate,
      findFirst: mockGoalProgressFindFirst,
      update: mockGoalProgressUpdate,
    },
  },
  active: () => ({ deletedAt: null }),
}))

vi.mock('@/lib/auth', () => ({
  getServerSession: mockGetServerSession,
  authOptions: {},
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { createGoal, updateGoalProgress, deleteGoal, completeGoal } from '@/lib/goal-actions'

describe('createGoal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } })
  })

  it('creates a goal with valid data', async () => {
    mockGoalCreate.mockResolvedValue({ id: 'goal-1' })
    mockGoalProgressCreate.mockResolvedValue({ id: 'progress-1' })

    const result = await createGoal({
      title: 'Reduce electricity usage',
      type: 'MONTHLY',
      targetKg: 100,
      baselineKg: 500,
      durationDays: 30,
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.goalId).toBe('goal-1')
    }

    expect(mockGoalCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          title: 'Reduce electricity usage',
          type: 'MONTHLY',
          targetKg: 100,
          currentKg: 0,
          status: 'ACTIVE',
        }),
      }),
    )
  })

  it('rejects when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)

    const result = await createGoal({
      title: 'My goal',
      type: 'WEEKLY',
      targetKg: 50,
      baselineKg: 200,
      durationDays: 30,
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('Not authenticated')
    }
  })

  it('rejects empty title', async () => {
    const result = await createGoal({
      title: '',
      type: 'WEEKLY',
      targetKg: 50,
      baselineKg: 200,
      durationDays: 30,
    })

    expect(result.ok).toBe(false)
  })

  it('rejects targetKg less than 1', async () => {
    const result = await createGoal({
      title: 'My goal',
      type: 'WEEKLY',
      targetKg: 0,
      baselineKg: 200,
      durationDays: 30,
    })

    expect(result.ok).toBe(false)
  })
})

describe('updateGoalProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } })
  })

  it('updates goal progress successfully', async () => {
    mockGoalFindFirst.mockResolvedValue({
      id: 'goal-1',
      targetKg: 100,
      baselineKg: 500,
      endDate: new Date('2026-07-21'),
    })

    mockGoalUpdate.mockResolvedValue({ id: 'goal-1' })

    mockGoalProgressFindFirst.mockResolvedValue({
      id: 'progress-1',
    })

    mockGoalProgressUpdate.mockResolvedValue({ id: 'progress-1' })

    const result = await updateGoalProgress('goal-1', 50)

    expect(result.ok).toBe(true)
    expect(mockGoalUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'goal-1' },
        data: expect.objectContaining({
          currentKg: 50,
          status: 'ACTIVE',
        }),
      }),
    )
  })

  it('rejects when goal is not found', async () => {
    mockGoalFindFirst.mockResolvedValue(null)

    const result = await updateGoalProgress('nonexistent-goal', 50)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('Goal not found')
    }
  })

  it('marks goal as COMPLETED when progress reaches 100%', async () => {
    mockGoalFindFirst.mockResolvedValue({
      id: 'goal-1',
      targetKg: 100,
      baselineKg: 500,
      endDate: new Date('2026-07-21'),
    })

    mockGoalUpdate.mockResolvedValue({ id: 'goal-1' })

    mockGoalProgressFindFirst.mockResolvedValue({
      id: 'progress-1',
    })

    mockGoalProgressUpdate.mockResolvedValue({ id: 'progress-1' })

    const result = await updateGoalProgress('goal-1', 100)

    expect(result.ok).toBe(true)
    expect(mockGoalUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          currentKg: 100,
          status: 'COMPLETED',
        }),
      }),
    )
  })

  it('creates new progress snapshot if none exists', async () => {
    mockGoalFindFirst.mockResolvedValue({
      id: 'goal-1',
      targetKg: 100,
      baselineKg: 200,
      endDate: new Date('2026-07-21'),
    })

    mockGoalUpdate.mockResolvedValue({ id: 'goal-1' })

    mockGoalProgressFindFirst.mockResolvedValue(null)

    mockGoalProgressCreate.mockResolvedValue({ id: 'progress-new' })

    const result = await updateGoalProgress('goal-1', 30)

    expect(result.ok).toBe(true)
    expect(mockGoalProgressCreate).toHaveBeenCalled()
  })
})

describe('completeGoal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } })
  })

  it('completes a goal successfully', async () => {
    mockGoalFindFirst.mockResolvedValue({
      id: 'goal-1',
      targetKg: 100,
    })

    mockGoalUpdate.mockResolvedValue({ id: 'goal-1' })

    const result = await completeGoal('goal-1')

    expect(result.ok).toBe(true)
    expect(mockGoalUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'goal-1' },
        data: expect.objectContaining({
          status: 'COMPLETED',
          currentKg: 100,
        }),
      }),
    )
  })

  it('rejects when goal is not found', async () => {
    mockGoalFindFirst.mockResolvedValue(null)

    const result = await completeGoal('nonexistent')

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('Goal not found')
    }
  })
})

describe('deleteGoal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } })
  })

  it('soft-deletes a goal', async () => {
    mockGoalUpdate.mockResolvedValue({ id: 'goal-1' })

    const result = await deleteGoal('goal-1')

    expect(result.ok).toBe(true)
    expect(mockGoalUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'goal-1' },
        data: expect.objectContaining({
          deletedAt: expect.any(Date),
        }),
      }),
    )
  })

  it('rejects when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)

    const result = await deleteGoal('goal-1')
    expect(result.ok).toBe(false)
  })
})
