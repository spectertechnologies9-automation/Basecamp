import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Boxes, Sparkles } from 'lucide-react';
import { getServerUser } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { UnifiedPipeline } from '@/components/pipeline/unified-pipeline-view';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = await queryOne<any>('SELECT name FROM projects WHERE id = ?', [params.id]);
  return { title: `${project?.name ?? 'Project'} — Creative Pipeline` };
}

export default async function ProjectPipelinePage({ params }: Props) {
  const user = await getServerUser();
  if (!user) {
    redirect('/auth/login');
  }

  const project = await queryOne<any>('SELECT * FROM projects WHERE id = ?', [params.id]);
  if (!project) notFound();

  return (
    <div className="min-h-full p-6 max-w-7xl mx-auto space-y-6">
      {/* Back and Title */}
      <div className="flex items-center justify-between">
        <Link
          href={`/projects/${params.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={13} />
          Back to {project.name}
        </Link>
        <span className="text-xs font-mono uppercase text-primary border border-primary/30 bg-primary/10 px-2.5 py-0.5 rounded-full">
          Creative Pipeline
        </span>
      </div>

      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans">
          {project.name} — Pipeline
        </h1>
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mt-1">
          Drag and drop items through stage progression from onboarding to final approval
        </p>
      </div>

      <UnifiedPipeline projectId={params.id} showProjectFilter={false} />
    </div>
  );
}
