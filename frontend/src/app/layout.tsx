import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'HireAI — Autonomous AI Interviewer Platform',
  description: 'Intelligent AI-driven interviews. Resume parsing, JD matching, real-time video/voice interviews, and comprehensive skill assessments.',
  keywords: 'AI interview, automated recruitment, skill assessment, video interview, HR automation',
  openGraph: {
    title: 'HireAI — Autonomous AI Interviewer Platform',
    description: 'Automate your hiring with AI-powered video & voice interviews.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: 'Satoshi, sans-serif',
              fontSize: '0.875rem',
              fontWeight: '500',
              borderRadius: '0.75rem',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
            },
            success: {
              style: { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' },
              iconTheme: { primary: '#16a34a', secondary: '#f0fdf4' },
            },
            error: {
              style: { background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3' },
              iconTheme: { primary: '#e11d48', secondary: '#fff1f2' },
            },
          }}
        />
      </body>
    </html>
  )
}
