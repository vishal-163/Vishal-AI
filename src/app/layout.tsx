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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
      </head>
      <body className="min-h-screen min-h-[100dvh] bg-[#09090b] antialiased">
        {children}
      </body>
    </html>
  );
}
