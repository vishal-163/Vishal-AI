import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vishal AI — One AI API for Every Project',
  description:
    'Build once. Power every website, chatbot, tool, and app with a single AI API platform. Generate API keys and integrate AI into all your projects.',
  keywords: ['AI API', 'LLM', 'API keys', 'chat completions', 'Vishal AI'],
  openGraph: {
    title: 'Vishal AI — One AI API for Every Project',
    description: 'Build once. Power every website, chatbot, tool, and app.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#09090b] antialiased">
        {children}
      </body>
    </html>
  );
}
