import type { NextApiRequest, NextApiResponse } from 'next'
import { redis } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'
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
  if (req.method === 'GET') {
    return res.status(200).json(await getCandidates())
  }
  if (req.method === 'POST') {
    const candidates = await getCandidates()
    const now = new Date().toISOString()
    const candidate: Candidate = { ...req.body, id: uuidv4(), createdAt: now, updatedAt: now, log: req.body.log || [] }
    candidates.push(candidate)
    await saveCandidates(candidates)
    return res.status(201).json(candidate)
  }
  res.status(405).json({ error: 'Method not allowed' })
}
