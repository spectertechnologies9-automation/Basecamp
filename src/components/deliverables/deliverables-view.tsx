'use client';

import { useState, useEffect } from 'react';
import { Package, Download, Eye, FileImage, FileVideo, FileText, Search, Plus, Sparkles, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface DeliverableFile {
  id: string;
  name: string;
  file_path: string;
  content_type: string;
  size: string;
  status: string;
  created_at: string;
}

const DEFAULT_FILES: DeliverableFile[] = [
  {
    id: 'd1',
    name: 'Apex_Brand_Guidelines_v2.0_Final.pdf',
    file_path: '/assets/Apex_Brand_Guidelines_v2.0_Final.pdf',
    content_type: 'document',
    size: '14.8 MB',
    status: 'approved',
    created_at: '2026-10-22T10:00:00Z',
  },
  {
    id: 'd2',
    name: 'Q4_Hero_Launch_Reel_4k_Export.mp4',
    file_path: '/assets/Q4_Hero_Launch_Reel_4k_Export.mp4',
    content_type: 'video',
    size: '52.4 MB',
    status: 'approved',
    created_at: '2026-10-23T14:30:00Z',
  },
  {
    id: 'd3',
    name: 'Logo_Lockup_Master_Package_Vectors.zip',
    file_path: '/assets/Logo_Lockup_Master_Package_Vectors.zip',
    content_type: 'archive',
    size: '32.1 MB',
    status: 'approved',
    created_at: '2026-10-24T09:15:00Z',
  },
];

export function Deliverables({ projectId }: { projectId: string }) {
  const [files, setFiles] = useState<DeliverableFile[]>(DEFAULT_FILES);
  const [search, setSearch] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState('document');

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const getFileIcon = (contentType: string) => {
    if (contentType === 'video') return <FileVideo className="h-5 w-5 text-orange-400" />;
    if (contentType === 'image') return <FileImage className="h-5 w-5 text-sky-400" />;
    return <FileText className="h-5 w-5 text-emerald-400" />;
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    const newFile: DeliverableFile = {
      id: 'd_' + Date.now(),
      name: newFileName.trim(),
      file_path: '#' + newFileName.trim(),
      content_type: newFileType,
      size: '4.2 MB',
      status: 'approved',
      created_at: new Date().toISOString(),
    };
    setFiles([newFile, ...files]);
    setNewFileName('');
    setUploadOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-semibold text-foreground">Approved Deliverables</h3>
          <Badge variant="secondary" className="text-[10px] font-mono">
            {files.length} final files
          </Badge>
        </div>

        <Button
          size="sm"
          onClick={() => setUploadOpen(true)}
          className="text-xs font-mono uppercase tracking-wider gap-1.5 h-8 bg-primary text-primary-foreground font-semibold"
        >
          <Plus size={13} /> Add Deliverable
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search deliverables by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-xs font-mono"
        />
      </div>

      {/* Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFiles.map((file) => (
          <div
            key={file.id}
            className="rf-card p-4 flex flex-col justify-between hover:border-primary/40 transition-all group"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="p-2.5 rounded-lg bg-secondary/50 border border-border">
                  {getFileIcon(file.content_type)}
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <CheckCircle2 size={10} /> Approved
                </span>
              </div>

              <h4 className="text-sm font-semibold text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                {file.name}
              </h4>
              <p className="text-[11px] font-mono text-muted-foreground">
                Size: {file.size} • Added {new Date(file.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-border/50 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs font-mono uppercase tracking-wider gap-1.5 h-8"
                onClick={() => alert(`Downloading deliverable: ${file.name}`)}
              >
                <Download size={13} />
                Download
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold font-mono uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Register Deliverable File
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">
                Deliverable Name
              </label>
              <Input
                placeholder="e.g. Master_Logo_Kit.zip"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">
                Content Format
              </label>
              <select
                className="flex h-9 w-full rounded-md border border-border bg-transparent px-3 py-1 text-xs font-mono"
                value={newFileType}
                onChange={(e) => setNewFileType(e.target.value)}
              >
                <option value="document">Document (PDF/DOCX)</option>
                <option value="video">Video (MP4/MOV)</option>
                <option value="image">Image (PNG/JPG/SVG)</option>
                <option value="archive">Archive (ZIP/TAR)</option>
              </select>
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setUploadOpen(false)}
                className="text-xs font-mono uppercase"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="text-xs font-mono uppercase bg-primary text-primary-foreground font-semibold"
              >
                Save Deliverable
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
