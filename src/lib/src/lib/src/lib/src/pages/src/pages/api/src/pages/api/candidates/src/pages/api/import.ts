import type { NextApiRequest, NextApiResponse } from 'next'
import { redis } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'
import { Candidate, findDocData } from '@/lib/types'

const KV_KEY = 'lingoking:candidates'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { rows } = req.body as { rows: string[][] }
  if (!rows || !Array.isArray(rows)) return res.status(400).json({ error: 'Invalid data' })

  const now = new Date().toISOString()
  const candidates: Candidate[] = []

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    const name = String(r[0] || '').trim()
    if (!name) continue
    const docData = findDocData(name)
    candidates.push({
      id: uuidv4(), name,
      rev: String(r[1] || 'Pendiente'),
      envio: String(r[3] || 'No'),
      transl: String(r[5] || 'Pendiente'),
      deficit: String(r[8] || 'Pendiente'),
      deadline: docData?.deadline || String(r[10] || ''),
      aktenzeichen: docData?.aktenzeichen || '',
      comments: String(r[11] || ''),
      factura: String(r[12] || '').toLowerCase() === 'true' ? 'true' : 'false',
      log: docData?.log || [],
      createdAt: now, updatedAt: now,
    })
  }

  await redis.set(KV_KEY, candidates)
  return res.status(200).json({ count: candidates.length, withDoc: candidates.filter(c => findDocData(c.name)).length })
}
