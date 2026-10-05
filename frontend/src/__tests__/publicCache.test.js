import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearPublicCache,
  isPublicCacheFresh,
  readPublicCache,
  writePublicCache,
} from '../services/publicCache'

describe('publicCache', () => {
  beforeEach(() => clearPublicCache('events'))

  it('keeps a public response available for an instant return visit', () => {
    writePublicCache('events', [{ id: 7, title: 'Design Meetup' }])

    const cachedEvents = readPublicCache('events')

    expect(cachedEvents.data).toEqual([{ id: 7, title: 'Design Meetup' }])
    expect(isPublicCacheFresh(cachedEvents)).toBe(true)
  })
})
