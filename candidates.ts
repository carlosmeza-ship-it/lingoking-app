import { Candidate } from './types'

// Smart email parser: extracts candidate name, date, and summary from pasted email text
export function parseEmail(emailText: string, candidates: Candidate[]): {
  candidateName: string | null
  date: string
  summary: string
  confidence: 'high' | 'medium' | 'low'
} {
  const today = new Date()
  const defaultDate = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getFullYear()).slice(2)}`

  // Try to find a candidate name in the email
  let candidateName: string | null = null
  let confidence: 'high' | 'medium' | 'low' = 'low'

  // 1. Try direct name match against candidate list
  const lowerEmail = emailText.toLowerCase()
  let bestMatch = { name: '', score: 0 }

  for (const c of candidates) {
    const parts = c.name.toLowerCase().split(' ').filter(p => p.length > 3)
    let score = 0
    for (const part of parts) {
      if (lowerEmail.includes(part)) score++
    }
    const ratio = parts.length > 0 ? score / parts.length : 0
    if (ratio > bestMatch.score) {
      bestMatch = { name: c.name, score: ratio }
    }
  }

  if (bestMatch.score >= 0.6) {
    candidateName = bestMatch.name
    confidence = bestMatch.score >= 0.8 ? 'high' : 'medium'
  }

  // 2. Extract date from email
  let date = defaultDate
  const datePatterns = [
    /(\d{2}\.\d{2}\.\d{4})/,
    /(\d{2}\.\d{2}\.\d{2})/,
    /(\d{1,2}\.\d{1,2}\.)/,
  ]
  for (const pattern of datePatterns) {
    const m = emailText.match(pattern)
    if (m) { date = m[1]; break }
  }

  // 3. Build summary: take first meaningful lines, skip headers
  const lines = emailText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 20)
    .filter(l => !l.match(/^(de:|para:|cc:|asunto:|subject:|from:|to:|date:|fecha:)/i))
    .filter(l => !l.match(/^>{1,}/))
    .slice(0, 4)

  const summary = lines.join(' ').slice(0, 400) || emailText.slice(0, 300)

  return { candidateName, date, summary, confidence }
}

// Detect keywords in a note to suggest stage updates
export function detectStageHints(note: string): {
  suggestRev?: string
  suggestEnvio?: string
  suggestTransl?: string
  suggestDeficit?: string
} {
  const n = note.toLowerCase()
  const hints: ReturnType<typeof detectStageHints> = {}

  if (n.includes('revisión ok') || n.includes('revision ok')) hints.suggestRev = 'Revisión Ok'
  else if (n.includes('comentario') || n.includes('corrección')) hints.suggestRev = 'Revisión con comentarios'

  if (n.includes('recibido en berlín') || n.includes('documentos recibidos') || n.includes('recibidos en berlín')) hints.suggestEnvio = 'Recibido'

  if (n.includes('traducciones terminadas') || n.includes('traducción terminada')) hints.suggestTransl = 'Traducción Terminada'
  else if (n.includes('enviados a traducir') || n.includes('enviado a traducir')) hints.suggestTransl = 'Traducción en proceso'

  if (n.includes('defizitbescheid solicitado') || n.includes('db solicitado') || n.includes('solicitud de defizit') || n.includes('defizit bescheid solicitado')) hints.suggestDeficit = 'Defizit solicitado'
  else if (n.includes('defizit ok') || n.includes('defizitbescheid ok')) hints.suggestDeficit = 'Defizit Ok'

  return hints
}
