import type { NextApiRequest, NextApiResponse } from 'next'
import { redis } from '@/lib/db'
import { Candidate } from '@/lib/types'

const KV_KEY = 'lingoking:candidates'

async function getCandidates(): Promise<Candidate[]> {
  try {
    const data = await redis.get<Candidate[]>(KV_KEY)
    return data || []
  } catch { return [] }
}

async function saveCandidates(candidates: Candidate[]) {
  await redis.set(KV_KEY, candidates)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  const candidates = await getCandidates()
  const idx = candidates.findIndex(c => c.id === id)

  if (req.method === 'PUT') {
    if (idx === -1) return res.status(404).json({ error: 'Not found' })
    candidates[idx] = { ...candidates[idx], ...req.body, id: id as string, updatedAt: new Date().toISOString() }
    await saveCandidates(candidates)
    return res.status(200).json(candidates[idx])
  }
  if (req.method === 'DELETE') {
    await saveCandidates(candidates.filter(c => c.id !== id))
    return res.status(200).json({ ok: true })
  }
  res.status(405).json({ error: 'Method not allowed' })
}
