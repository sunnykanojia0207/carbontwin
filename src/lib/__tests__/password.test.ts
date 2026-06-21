/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs'

// ============================================================================
// Tests for password hashing / verification / token generation.
// ============================================================================

vi.mock('bcryptjs', () => {
  const mockGenSalt = vi.fn()
  const mockHash = vi.fn()
  const mockCompare = vi.fn()
  return {
    default: {
      genSalt: mockGenSalt,
      hash: mockHash,
      compare: mockCompare,
    },
  }
})

import { hashPassword, verifyPassword, generateToken } from '@/lib/password'

const mockBcrypt = vi.mocked(bcrypt)

describe('hashPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('generates a salt and hashes the password', async () => {
    mockBcrypt.genSalt.mockResolvedValue('$2a$10$saltysalt' as never)
    mockBcrypt.hash.mockResolvedValue('$2a$10$hashedpasswordvalue' as never)

    const result = await hashPassword('my-secure-password')

    expect(mockBcrypt.genSalt).toHaveBeenCalledWith(10)
    expect(mockBcrypt.hash).toHaveBeenCalledWith('my-secure-password', '$2a$10$saltysalt')
    expect(result).toBe('$2a$10$hashedpasswordvalue')
  })

  it('handles empty string password', async () => {
    mockBcrypt.genSalt.mockResolvedValue('$2a$10$salt' as never)
    mockBcrypt.hash.mockResolvedValue('$2a$10$emptyhash' as never)

    const result = await hashPassword('')

    expect(result).toBe('$2a$10$emptyhash')
  })
})

describe('verifyPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns true when password matches hash', async () => {
    mockBcrypt.compare.mockResolvedValue(true as never)

    const result = await verifyPassword('correct-password', '$2a$10$storedhash')

    expect(result).toBe(true)
    expect(mockBcrypt.compare).toHaveBeenCalledWith('correct-password', '$2a$10$storedhash')
  })

  it('returns false when password does not match hash', async () => {
    mockBcrypt.compare.mockResolvedValue(false as never)

    const result = await verifyPassword('wrong-password', '$2a$10$storedhash')

    expect(result).toBe(false)
  })

  it('returns false when hash is null', async () => {
    const result = await verifyPassword('any-password', null)
    expect(result).toBe(false)
    expect(mockBcrypt.compare).not.toHaveBeenCalled()
  })

  it('returns false when hash is undefined', async () => {
    const result = await verifyPassword('any-password', undefined)
    expect(result).toBe(false)
    expect(mockBcrypt.compare).not.toHaveBeenCalled()
  })

  it('returns false when bcrypt.compare throws', async () => {
    mockBcrypt.compare.mockRejectedValue(new Error('bcrypt error') as never)

    const result = await verifyPassword('any-password', 'malformed-hash')

    expect(result).toBe(false)
  })
})

describe('generateToken', () => {
  it('generates a 64-character hex string', () => {
    const token = generateToken()
    expect(token).toHaveLength(64)
    expect(/^[0-9a-f]{64}$/.test(token)).toBe(true)
  })

  it('generates different tokens on each call', () => {
    const tokens = new Set(Array.from({ length: 10 }, () => generateToken()))
    expect(tokens.size).toBe(10)
  })
})
