import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type FileItem = { name: string; path: string; updatedAt?: string };

type Props = {
  open: boolean;
  onClose: () => void;
  files: FileItem[];
  onDownload: (path: string) => void;
};

export default function DownloadCSVOptionsModal({ open, onClose, files, onDownload }: Props) {
  const [selectedPath, setSelectedPath] = useState<string>('');

  useEffect(() => {
    if (open) {
      setSelectedPath(files[0]?.path || '');
    }
  }, [open, files]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-2xl w-[720px]">
        <DialogHeader>
          <DialogTitle>Select CSV to download</DialogTitle>
          <DialogDescription>
            {files.length} file{files.length !== 1 ? 's' : ''} match this project.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[420px] overflow-y-auto space-y-2">
          {files.map((f) => (
            <label key={f.path} className="flex items-start gap-3 p-2 rounded-md hover:bg-muted cursor-pointer">
              <input
                type="radio"
                name="csv-choice"
                value={f.path}
                checked={selectedPath === f.path}
                onChange={() => setSelectedPath(f.path)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium break-words">{f.name}</div>
                {f.updatedAt && (
                  <div className="text-xs text-muted-foreground">Updated: {new Date(f.updatedAt).toLocaleString()}</div>
                )}
              </div>
            </label>
          ))}
          {files.length === 0 && (
            <div className="text-sm text-muted-foreground">No files available.</div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button onClick={() => selectedPath && onDownload(selectedPath)} disabled={!selectedPath}>
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


