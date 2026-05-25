import Link from 'next/link';
import { ARTICLE_MAP, ARTICLE_TITLES } from '@/lib/indicatorData';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  return Object.keys(ARTICLE_MAP).map(slug => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const title = ARTICLE_TITLES[slug];
  if (!title) return {};
  return { title: `${title} — Long Cycle Capital` };
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const src = ARTICLE_MAP[slug];
  if (!src) notFound();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ background: '#F2F0EB', borderBottom: '1px solid rgba(44,62,80,0.10)', padding: '12px clamp(20px,5vw,40px)' }}>
        <Link href="/research" style={{
          fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          color: '#7F8C8D', textDecoration: 'none',
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          ← Research
        </Link>
      </div>
      <iframe
        src={src}
        style={{ flex: 1, border: 'none', width: '100%', minHeight: 'calc(100vh - 112px)' }}
        title={ARTICLE_TITLES[slug]}
      />
    </div>
  );
}
