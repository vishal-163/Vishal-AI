import Link from 'next/link';

/* ─── Icon Components ─────────────────────────── */
const KeyIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
  </svg>
);

const BoltIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

const CodeIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const ScaleIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const CrossIcon = () => (
  <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

/* ─── Data ────────────────────────────────────── */
const features = [
  { icon: <KeyIcon />, title: 'API Key Management', desc: 'Generate, rename, revoke API keys. Use them across every project seamlessly.' },
  { icon: <BoltIcon />, title: 'Blazing Fast Inference', desc: 'Ultra-fast AI responses with sub-second latency powered by Vishal AI.' },
  { icon: <ChartIcon />, title: 'Usage Analytics', desc: 'Track requests, tokens, errors, and latency with real-time dashboards.' },
  { icon: <CodeIcon />, title: 'SDK Ready', desc: 'OpenAI-compatible API. Works with any SDK, framework, or language.' },
  { icon: <ShieldIcon />, title: 'Enterprise Security', desc: 'SHA-256 hashed keys, rate limiting, input validation, and CORS protection.' },
  { icon: <ScaleIcon />, title: 'Built to Scale', desc: 'Modular architecture ready for more models, providers, and custom fine-tunes.' },
];

const pricingPlans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    desc: 'Perfect for side projects and experimentation.',
    features: [
      { text: '60 requests / minute', included: true },
      { text: '100K tokens / month', included: true },
      { text: '3 API keys', included: true },
      { text: 'Community support', included: true },
      { text: 'Priority support', included: false },
      { text: 'Custom models', included: false },
    ],
    cta: 'Get Started Free',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    desc: 'For developers shipping real products.',
    features: [
      { text: '300 requests / minute', included: true },
      { text: '1M tokens / month', included: true },
      { text: 'Unlimited API keys', included: true },
      { text: 'Priority support', included: true },
      { text: 'Advanced analytics', included: true },
      { text: 'Custom models', included: false },
    ],
    cta: 'Start Pro Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For teams and high-volume applications.',
    features: [
      { text: 'Unlimited requests', included: true },
      { text: 'Unlimited tokens', included: true },
      { text: 'Unlimited API keys', included: true },
      { text: 'Dedicated support', included: true },
      { text: 'Advanced analytics', included: true },
      { text: 'Custom fine-tuned models', included: true },
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

const faqs = [
  {
    q: 'What is Vishal AI?',
    a: 'Vishal AI is a branded AI platform that gives you API keys to power AI features across all your projects — websites, chatbots, tools, and apps — using a single, unified API.',
  },
  {
    q: 'Is the API OpenAI-compatible?',
    a: 'Yes. Vishal AI follows the OpenAI chat completions format. You can use any OpenAI-compatible SDK or library by simply pointing it to your Vishal AI endpoint.',
  },
  {
    q: 'Which AI models are available?',
    a: 'V1 ships with our high-performance Vishal AI model for ultra-fast inference. The architecture is built to support additional models and providers in future updates.',
  },
  {
    q: 'How are API keys secured?',
    a: 'API keys are hashed with SHA-256 before storage. The full key is shown only once at creation. We never store or log plaintext keys.',
  },
  {
    q: 'Can I use this for commercial projects?',
    a: 'Absolutely. Vishal API is built for production use. Generate an API key, integrate it into your project, and ship.',
  },
  {
    q: 'Will more models be added?',
    a: 'Yes. The platform is designed with a modular provider architecture. Support for additional models, providers, and even custom fine-tuned models is on the roadmap.',
  },
];

/* ─── Page Component ─────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* ─── Navbar ──────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#09090b]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center font-bold text-white text-sm">
              V
            </div>
            <span className="font-semibold text-lg text-white">Vishal AI</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-zinc-400 hover:text-white transition-colors">Features</a>
            <a href="#faq" className="text-sm text-zinc-400 hover:text-white transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost text-zinc-300">Log in</Link>
            <Link href="/signup" className="btn-primary !py-2 !px-5 !text-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────── */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 hero-glow" />
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-500/[0.07] rounded-full blur-[120px]" />

        <div className="relative max-w-5xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-xs text-zinc-400 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Now live — Powered by Vishal AI
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] mb-6">
            <span className="text-white">One AI API for</span>
            <br />
            <span className="gradient-text">Every Project.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed text-balance">
            Build once. Power every website, chatbot, tool, and app
            with a single API key from your own AI platform.
          </p>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-4">
            <Link href="/signup" className="btn-primary !py-3.5 !px-8 !text-base">
              Get Started Free
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>

          {/* Code Preview */}
          <div className="mt-16 max-w-xl mx-auto">
            <div className="code-block text-left text-xs md:text-sm">
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/[0.06]">
                <span className="w-3 h-3 rounded-full bg-red-500/60" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <span className="w-3 h-3 rounded-full bg-green-500/60" />
                <span className="text-zinc-600 ml-2 text-xs">api-request.sh</span>
              </div>
              <code>
                <span className="text-emerald-400">curl</span>{' '}
                <span className="text-zinc-500">-X POST</span>{' '}
                <span className="text-amber-300">your-domain.com/api/v1/chat/completions</span>{' '}
                <span className="text-zinc-500">\</span>
                {'\n  '}<span className="text-zinc-500">-H</span>{' '}
                <span className="text-sky-300">{'"Authorization: Bearer vk-your-key"'}</span>{' '}
                <span className="text-zinc-500">\</span>
                {'\n  '}<span className="text-zinc-500">-d</span>{' '}
                <span className="text-orange-300">{'\'{"messages": [{"role": "user", "content": "Hello!"}]}\''}</span>
              </code>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ────────────────────────── */}
      <section id="features" className="relative py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything you need to ship AI
            </h2>
            <p className="text-zinc-400 text-lg max-w-xl mx-auto">
              One platform, one API, infinite possibilities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div
                key={i}
                className="glass-card-hover p-6 group"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-4 group-hover:bg-brand-500/20 transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* ─── FAQ ─────────────────────────────── */}
      <section id="faq" className="relative py-24 md:py-32">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Frequently asked questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="glass-card group"
              >
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                  <span className="text-sm font-medium text-zinc-200 pr-4">{faq.q}</span>
                  <svg
                    className="w-5 h-5 text-zinc-500 shrink-0 transition-transform group-open:rotate-45"
                    fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </summary>
                <div className="px-5 pb-5 text-sm text-zinc-400 leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────── */}
      <section className="relative py-24 md:py-32">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="glass-card p-12 md:p-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/[0.08] to-violet-500/[0.08]" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to power your projects?
              </h2>
              <p className="text-zinc-400 text-lg mb-8 max-w-lg mx-auto">
                Create your account, generate an API key, and start building in minutes.
              </p>
              <Link href="/signup" className="btn-primary !py-3.5 !px-8 !text-base">
                Get Started Free
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center font-bold text-white text-xs">
                V
              </div>
              <span className="font-semibold text-white">Vishal AI</span>
            </div>

            <div className="flex items-center gap-8">
              <a href="#features" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Features</a>
              <Link href="/login" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Dashboard</Link>
            </div>

            <p className="text-xs text-zinc-600">
              Powered by Vishal AI &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
