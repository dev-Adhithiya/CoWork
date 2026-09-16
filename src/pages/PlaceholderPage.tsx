import { ArrowRight, Construction } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PlaceholderPage({ title, description, nextPath }: { title: string; description: string; nextPath?: string }) {
  return (
    <section className="flex h-full min-h-0 items-center justify-center">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-300/20 bg-blue-400/10 text-blue-200">
          <Construction className="h-6 w-6" />
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-300/70">Route ready</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-white/55">{description}</p>
        {nextPath && (
          <Link to={nextPath} className="mt-6 inline-flex items-center gap-2 rounded-xl border border-blue-300/20 bg-blue-500/15 px-4 py-2.5 text-sm text-blue-100 transition hover:bg-blue-500/25">
            Open workspace chat <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </section>
  );
}

export default PlaceholderPage;
