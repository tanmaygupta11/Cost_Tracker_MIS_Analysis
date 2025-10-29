import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type UploadLeadsCSVModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

type LeadsCsvRow = {
  user_id?: string | null;
  cost?: number | null;
  project_id?: string | null;
  projectid?: string | null;
  project_name?: string | null;
  lead_id?: string | null;
  work_completion_date?: string | null;
  unit_basis_commercial?: string | null;
  project_incharge_approval?: boolean | null;
  project_incharge_approval_date?: string | null;
  client_incharge_approval?: boolean | null;
  client_incharge_approval_date?: string | null;
  zone?: string | null;
  state?: string | null;
  city?: string | null;
  tc_code?: string | null;
  role?: string | null;
  shift?: string | null;
};

const REQUIRED_HEADERS = [
  'lead_id',
  'project_id',
  'project_name',
  'work_completion_date',
  'unit_basis_commercial',
  'project_incharge_approval',
  'project_incharge_approval_date',
  'client_incharge_approval',
  'client_incharge_approval_date',
  'user_id',
  'cost',
  'zone',
  'state',
  'city',
  'tc_code',
  'role',
  'shift',
];

function normalizeDate(input: string | undefined | null): string | null {
  if (!input) return null;
  const v = String(input).trim();
  if (!v) return null;
  const dm = v.match(/^\d{2}-\d{2}-\d{4}$/);
  if (dm) {
    const [d, m, y] = v.split('-');
    return `${y}-${m}-${d}`;
  }
  const ym = v.match(/^\d{4}-\d{2}$/);
  if (ym) return `${v}-01`;
  const d = new Date(v);
  if (isNaN(d.getTime())) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function toNumber(n: string | number | undefined | null): number | null {
  if (n === undefined || n === null) return null;
  const num = typeof n === 'number' ? n : Number(String(n).replace(/[,\s]/g, ''));
  return isFinite(num) ? num : null;
}

function toBoolean(v: string | boolean | null | undefined): boolean | null {
  if (v === undefined || v === null) return null;
  if (typeof v === 'boolean') return v;
  const s = v.toString().trim().toLowerCase();
  if (s === 'true' || s === '1' || s === 'yes' || s === 'approved') return true;
  if (s === 'false' || s === '0' || s === 'no' || s === 'rejected') return false;
  return null;
}

export default function UploadLeadsCSVModal({ open, onClose, onSuccess }: UploadLeadsCSVModalProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [valid, setValid] = useState(false);
  const [rows, setRows] = useState<LeadsCsvRow[]>([]);
  const [summary, setSummary] = useState<{ processed: number; inserted: number; skipped: number; failed: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setParsing(false);
      setValid(false);
      setRows([]);
      setSummary(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  }, [open]);

  async function parseCSV(): Promise<LeadsCsvRow[]> {
    setParsing(true);
    setSummary(null);
    const csvText = await (file ? file.text() : Promise.resolve(''));
    if (!csvText) {
      setParsing(false);
      toast({ title: 'No CSV provided', description: 'Upload a file.', variant: 'destructive' });
      return [];
    }

    const lines = csvText.split(/\r?\n/).filter(l => l.trim() !== '');
    if (lines.length < 2) {
      setParsing(false);
      toast({ title: 'Invalid CSV', description: 'CSV must include a header and at least one row.', variant: 'destructive' });
      return [];
    }
    const headers = lines[0].split(',').map(h => h.trim());
    const headerSet = new Set(headers.map(h => h.toLowerCase()));
    const missing = REQUIRED_HEADERS.filter(h => !headerSet.has(h));
    if (missing.length > 0) {
      setParsing(false);
      toast({ title: 'Missing headers', description: `Add: ${missing.join(', ')}`, variant: 'destructive' });
      return [];
    }

    const results: LeadsCsvRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      if (cols.length === 0) continue;
      const rec: Record<string, string> = {};
      headers.forEach((h, idx) => { rec[h.trim()] = (cols[idx] ?? '').trim(); });

      const row: LeadsCsvRow = {
        user_id: rec['user_id'] || null,
        cost: toNumber(rec['cost']),
        project_id: rec['project_id'] || null,
        projectid: rec['projectid'] || null,
        project_name: rec['project_name'] || null,
        lead_id: (rec['lead_id'] || '').trim() || null,
        work_completion_date: normalizeDate(rec['work_completion_date']),
        unit_basis_commercial: rec['unit_basis_commercial'] || null,
        project_incharge_approval: toBoolean(rec['project_incharge_approval']),
        project_incharge_approval_date: normalizeDate(rec['project_incharge_approval_date']),
        client_incharge_approval: toBoolean(rec['client_incharge_approval']),
        client_incharge_approval_date: normalizeDate(rec['client_incharge_approval_date']),
        zone: rec['zone'] || null,
        state: rec['state'] || null,
        city: rec['city'] || null,
        tc_code: rec['tc_code'] || null,
        role: rec['role'] || null,
        shift: rec['shift'] || null,
      };
      if (!row.lead_id) continue;
      results.push(row);
    }

    setParsing(false);
    setValid(results.length > 0);
    setRows(results);
    toast({ title: 'CSV validated', description: `${results.length} valid rows ready.` });
    return results;
  }

  async function handleValidate() {
    try { await parseCSV(); } catch {}
  }

  async function handleSubmit() {
    try {
      const parsed = rows.length > 0 ? rows : await parseCSV();
      if (parsed.length === 0) return;

      // Fetch existing lead_ids to skip duplicates
      const leadIds = Array.from(new Set(parsed.map(r => r.lead_id!).filter(Boolean)));
      let existingIds = new Set<string>();
      if (leadIds.length > 0) {
        // Fetch in chunks of 1000 ids to avoid URL length issues
        const chunkSize = 1000;
        for (let i = 0; i < leadIds.length; i += chunkSize) {
          const chunk = leadIds.slice(i, i + chunkSize);
          const { data } = await supabase.from('leads').select('lead_id').in('lead_id', chunk);
          if (data) data.forEach(d => existingIds.add(d.lead_id));
        }
      }

      const seen = new Set<string>();
      const toInsert = parsed.filter(r => {
        const key = r.lead_id || '';
        if (!key) return false;
        if (existingIds.has(key) || seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      let inserted = 0; let failed = 0;
      const chunkSize = 500;
      for (let i = 0; i < toInsert.length; i += chunkSize) {
        const chunk = toInsert.slice(i, i + chunkSize);
        const { error } = await supabase.from('leads').insert(chunk);
        if (error) failed += chunk.length; else inserted += chunk.length;
      }

      const skipped = parsed.length - inserted - failed;
      setSummary({ processed: parsed.length, inserted, skipped, failed });
      toast({ title: 'Leads import complete', description: `Inserted ${inserted}, skipped ${skipped}, failed ${failed}` });
      if (inserted > 0) onSuccess();
    } catch (e: any) {
      toast({ title: 'Import failed', description: e?.message || 'Unknown error', variant: 'destructive' });
    }
  }

  const sampleHeader = REQUIRED_HEADERS.join(',');
  const sampleRow = 'L123,P001,Project Alpha,2025-02-01,Monthly,true,2025-02-05,true,2025-02-10,U001,250,North,StateX,CityY,TC123,Guard,Day';

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-4xl w-[1000px]">
        <DialogHeader>
          <DialogTitle>Add Leads via CSV</DialogTitle>
          <DialogDescription>
            Upload CSV to insert rows into leads. Required headers:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 w-[820px] break-words">
          <div className="text-sm p-3 rounded-md bg-muted whitespace-pre-wrap break-words">
            <div className="break-words"><span className="font-medium">Headers:</span> {sampleHeader}</div>
            <div className="mt-2 break-words"><span className="font-medium">Sample row:</span> {sampleRow}</div>
            <ul className="list-disc ml-5 mt-3 space-y-1">
              <li>id is auto-assigned by the database; do not include it.</li>
              <li>Dates: YYYY-MM-DD, YYYY-MM auto-fills day as 01; dd-mm-yyyy allowed.</li>
              <li>Approvals must be boolean-like values (true/false/approved/rejected).</li>
              <li>Duplicates are skipped by lead_id.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Upload CSV file</label>
            <Input ref={inputRef} type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>

          {summary && (
            <div className="text-sm p-3 rounded-md bg-muted">
              Processed: {summary.processed} • Inserted: {summary.inserted} • Skipped: {summary.skipped} • Failed: {summary.failed}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleValidate} disabled={parsing}>Validate</Button>
            <Button onClick={handleSubmit} disabled={parsing || (!valid && rows.length === 0)}>Add CSV</Button>
            <Button variant="secondary" onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


