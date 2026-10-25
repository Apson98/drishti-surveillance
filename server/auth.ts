// Admin sign-in: one password from the environment, a signed cookie for the session.
import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'

const PASSWORD = process.env.ADMIN_PASSWORD || ''
const SECRET = process.env.SESSION_SECRET || randomBytes(32).toString('hex') // sessions reset on restart if unset
const COOKIE = 'ds_admin'
const MAX_AGE_MS = 1000 * 60 * 60 * 12 // 12 hours

if (!PASSWORD) console.warn('\n  ⚠  ADMIN_PASSWORD is not set. Copy .env.example to .env and set one before using the admin.\n')

const sign = (payload: string) => createHmac('sha256', SECRET).update(payload).digest('base64url')

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

export function checkPassword(input: string) {
  return Boolean(PASSWORD) && safeEqual(sign(input), sign(PASSWORD))
}

export function issueSession(req: Request, res: Response) {
  const exp = String(Date.now() + MAX_AGE_MS)
  res.cookie(COOKIE, `${exp}.${sign(exp)}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: req.secure, // true behind HTTPS
    maxAge: MAX_AGE_MS,
    path: '/',
  })
}

export function clearSession(res: Response) {
  res.clearCookie(COOKIE, { path: '/' })
}

export function isAdmin(req: Request) {
  const raw = req.cookies?.[COOKIE]
  if (typeof raw !== 'string') return false
  const [exp, sig] = raw.split('.')
  return Boolean(exp && sig) && safeEqual(sig, sign(exp)) && Number(exp) > Date.now()
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Please sign in again.' })
  next()
}

// slow down password guessing: 8 failed tries per 15 minutes per address
const attempts = new Map<string, { n: number; until: number }>()
export function loginLimiter(req: Request, res: Response, next: NextFunction) {
  const key = req.ip || 'unknown'
  const a = attempts.get(key)
  if (a && a.until > Date.now() && a.n >= 8) return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' })
  next()
}
export function recordFailure(req: Request) {
  const key = req.ip || 'unknown'
  const a = attempts.get(key)
  if (!a || a.until < Date.now()) attempts.set(key, { n: 1, until: Date.now() + 15 * 60_000 })
  else a.n++
}
