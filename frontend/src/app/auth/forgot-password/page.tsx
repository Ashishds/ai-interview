'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Loader2, Mail, ArrowLeft, CheckCircle2, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { getApiUrl } from '@/lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return toast.error('Please enter your email address.')
    setLoading(true)
    try {
      const API_URL = getApiUrl()
      await fetch(`${API_URL}/api/v1/auth/forgot-password?email=${encodeURIComponent(email)}`, {
        method: 'POST',
      })
      // Always show success (backend never reveals if email exists)
      setSent(true)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ─── LEFT PANEL (dark brand side) ─── */}
      <div className="hidden lg:flex flex-col w-[520px] relative overflow-hidden p-14" style={{
        background: 'linear-gradient(155deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)'
      }}>
        {/* Background glows */}
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 20% 80%, rgba(99,102,241,0.25) 0%, transparent 55%),
                           radial-gradient(circle at 80% 20%, rgba(217,70,239,0.15) 0%, transparent 55%)`,
        }} />
        {/* Dot grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }} />

        <div className="relative z-10 flex flex-col h-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 mb-16 group">
            <Image src="/hireai-logo.png" alt="HireAI" width={44} height={44} className="rounded-xl object-cover logo-glow group-hover:scale-105 transition-transform" />
            <div>
              <div className="text-white font-bold text-xl tracking-tight">HireAI</div>
            </div>
          </Link>

          {/* Headline */}
          <div className="mb-12">
            <h2 className="text-4xl font-black text-white leading-tight mb-4" style={{ letterSpacing: '-0.03em' }}>
              Secure Account<br />
              <span className="gradient-text">Recovery</span>
            </h2>
            <p className="text-surface-400 text-base leading-relaxed">
              Enter your email and we'll send you a secure link to reset your password — no hassle, no waiting.
            </p>
          </div>

          {/* Security notes */}
          <div className="space-y-4 mb-auto">
            {[
              { text: 'Reset link expires in 15 minutes for your security' },
              { text: 'We never store or expose your password in plaintext' },
              { text: 'Powered by Supabase Auth with enterprise-grade encryption' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}>
                  <Shield className="w-4 h-4 text-brand-400" />
                </div>
                <span className="text-surface-300 text-sm font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── RIGHT PANEL (form) ─── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">

          {/* Mobile Logo */}
          <Link href="/" className="flex items-center gap-3 mb-10 lg:hidden">
            <Image src="/hireai-logo.png" alt="HireAI" width={36} height={36} className="rounded-xl object-cover logo-glow" />
            <span className="text-xl font-bold text-surface-900 tracking-tight">HireAI</span>
          </Link>

          {sent ? (
            /* ── Success State ── */
            <div className="text-center">
              <div className="w-20 h-20 bg-green-50 border-2 border-green-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h1 className="text-3xl font-black text-surface-900 mb-3 tracking-tight" style={{ letterSpacing: '-0.025em' }}>
                Check your inbox
              </h1>
              <p className="text-surface-500 text-sm font-medium leading-relaxed mb-2">
                We've sent a password reset link to
              </p>
              <p className="text-brand-600 font-bold text-sm mb-8">{email}</p>
              <p className="text-xs text-surface-400 mb-8 leading-relaxed">
                Didn't receive it? Check your spam folder, or{' '}
                <button
                  onClick={() => setSent(false)}
                  className="text-brand-600 font-bold hover:underline"
                >
                  try again with a different email
                </button>
                .
              </p>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 text-surface-700 font-semibold text-sm hover:text-brand-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Link>
            </div>
          ) : (
            /* ── Email Input Form ── */
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-black text-surface-900 mb-2 tracking-tight" style={{ letterSpacing: '-0.025em' }}>
                  Forgot password?
                </h1>
                <p className="text-surface-500 font-medium text-sm">
                  No worries — enter your email and we'll send a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-surface-800 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-surface-200 bg-white text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  id="forgot-password-submit"
                  className="w-full flex items-center justify-center gap-2.5 text-white font-bold py-4 rounded-2xl transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #6366f1 0%, #d946ef 100%)', boxShadow: '0 8px 24px rgba(99,102,241,0.35)' }}
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Sending reset link...</>
                  ) : (
                    <>Send Reset Link <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 text-surface-500 font-semibold text-sm hover:text-surface-800 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
