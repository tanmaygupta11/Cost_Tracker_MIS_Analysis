import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type UploadCSVModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

type MisCsvRow = {
  rev_month?: string;
  customer_name?: string;
  customer_id?: string;
  project_id?: string;
  project_name?: string;
  revenue?: number | null;
  approved_cost?: number | null;
  unapproved_lead_count?: number | null;
  unapproved_lead_cost?: number | null;
  lob?: string;
  margin?: number | null;
  sl_no?: any; // ignored
};

const REQUIRED_HEADERS = [
  'rev_month',
  'customer_name',
  'customer_id',
  'project_id',
  'project_name',
  'revenue',
  'approved_cost',
  'unapproved_lead_count',
  'unapproved_lead_cost',
  'lob',
  'margin',
];

function normalizeDate(input: string | undefined): string | null {
  if (!input) return null;
  const v = String(input).trim();
  if (!v) return null;
  // dd-mm-yyyy -> yyyy-mm-dd
  const dm = v.match(/^\d{2}-\d{2}-\d{4}$/);
  if (dm) {
    const [d, m, y] = v.split('-');
    return `${y}-${m}-${d}`;
  }
  // yyyy-mm -> yyyy-mm-01
  const ym = v.match(/^\d{4}-\d{2}$/);
  if (ym) return `${v}-01`;
  // Assume ISO or yyyy-mm-dd
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

export default function UploadCSVModal({ open, onClose, onSuccess }: UploadCSVModalProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [valid, setValid] = useState(false);
  const [rows, setRows] = useState<MisCsvRow[]>([]);
  const [summary, setSummary] = useState<{ processed: number; inserted: number; skipped: number; failed: number } | null>(null);
  const [conflictInfo, setConflictInfo] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setText('');
      setParsing(false);
      setValid(false);
      setRows([]);
      setSummary(null);
      setConflictInfo(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  }, [open]);

  // Authentication removed per request – inserts are allowed without login

  async function parseCSV(): Promise<MisCsvRow[]> {
    setParsing(true);
    setSummary(null);
    const csvText = text && text.trim().length > 0
      ? text
      : await (file ? file.text() : Promise.resolve(''));

    if (!csvText) {
      setParsing(false);
      toast({ title: 'No CSV provided', description: 'Upload a file or paste CSV text.', variant: 'destructive' });
      return [];
    }

    // Lightweight CSV parsing without dependency (simple split)
    // Assumes no embedded commas in quoted fields; for complex CSVs we can switch to Papa Parse.
    const lines = csvText.split(/\r?\n/).filter(l => l.trim() !== '');
    if (lines.length < 2) {
      setParsing(false);
      toast({ title: 'Invalid CSV', description: 'CSV must include a header and at least one row.', variant: 'destructive' });
      return [];
    }
    const headers = lines[0].split(',').map(h => h.trim());
    const headerSet = new Set(headers.map(h => h.toLowerCase()));

    // Validate required headers
    const missing = REQUIRED_HEADERS.filter(h => !headerSet.has(h));
    if (missing.length > 0) {
      setParsing(false);
      toast({ title: 'Missing headers', description: `Add: ${missing.join(', ')}`, variant: 'destructive' });
      return [];
    }

    // Map rows
    const results: MisCsvRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      if (cols.length === 0) continue;
      const rec: Record<string, string> = {};
      headers.forEach((h, idx) => { rec[h.trim()] = (cols[idx] ?? '').trim(); });
      const row: MisCsvRow = {
        rev_month: normalizeDate(rec['rev_month']),
        customer_name: (rec['customer_name'] || '').trim(),
        customer_id: (rec['customer_id'] || '').trim(),
        project_id: (rec['project_id'] || '').trim(),
        project_name: (rec['project_name'] || '').trim(),
        revenue: toNumber(rec['revenue']),
        approved_cost: toNumber(rec['approved_cost']),
        unapproved_lead_count: toNumber(rec['unapproved_lead_count']),
        unapproved_lead_cost: toNumber(rec['unapproved_lead_cost']),
        lob: (rec['lob'] || '').trim(),
        margin: toNumber(rec['margin']),
      };
      // Basic per-row validation
      if (!row.rev_month || !row.customer_id || !row.project_id) continue;
      results.push(row);
    }

    setParsing(false);
    setValid(results.length > 0);
    setRows(results);
    toast({ title: 'CSV validated', description: `${results.length} valid rows ready.` });
    return results;
  }

  async function handleValidate() {
    try {
      await parseCSV();
    } catch (e) {
      // already handled
    }
  }

  async function handleSubmit() {
    try {
      const parsed = rows.length > 0 ? rows : await parseCSV();
      if (parsed.length === 0) return;

      // Build distinct rev_month list to minimize queries
      const revMonths = Array.from(new Set(parsed.map(r => r.rev_month!).filter(Boolean)));

      // Fetch existing keys to skip duplicates
      const existingKeys = new Set<string>();
      // Batch fetch per rev_month to keep queries simpler
      for (const rm of revMonths) {
        const { data, error } = await supabase
          .from('mis_records')
          .select('rev_month, customer_id, project_id')
          .eq('rev_month', rm);
        if (!error && data) {
          for (const d of data) {
            const key = `${String(d.rev_month).substring(0,10)}|${d.customer_id}|${d.project_id}`;
            existingKeys.add(key);
          }
        }
      }

      // Filter out duplicates (existing and intra-file duplicates)
      const seen = new Set<string>();
      const toInsert = parsed.filter(r => {
        const key = `${r.rev_month!.substring(0,10)}|${r.customer_id}|${r.project_id}`;
        if (existingKeys.has(key) || seen.has(key)) return false;
        seen.add(key);
        return true;
      }).map(r => ({
        // Do not send sl_no so DB assigns serial automatically
        rev_month: r.rev_month,
        customer_name: r.customer_name,
        customer_id: r.customer_id,
        project_id: r.project_id,
        project_name: r.project_name,
        revenue: r.revenue,
        approved_cost: r.approved_cost,
        unapproved_lead_count: r.unapproved_lead_count,
        unapproved_lead_cost: r.unapproved_lead_cost,
        lob: r.lob,
        margin: r.margin,
      }));

      let inserted = 0;
      let failed = 0;
      let hadConflict = false;
      const chunkSize = 500;
      for (let i = 0; i < toInsert.length; i += chunkSize) {
        const chunk = toInsert.slice(i, i + chunkSize);
        const { error } = await supabase.from('mis_records').insert(chunk);
        if (error) {
          failed += chunk.length;
          // Detect duplicate/sequence conflict (HTTP 409 / code 23505)
          const msg = `${error.message || ''} ${error.details || ''}`.toLowerCase();
          if (msg.includes('duplicate key value') || msg.includes('conflict') || error.code === '23505') {
            hadConflict = true;
          }
        } else {
          inserted += chunk.length;
        }
      }

      const skipped = parsed.length - inserted - failed;
      setSummary({ processed: parsed.length, inserted, skipped, failed });
      if (hadConflict) {
        setConflictInfo(
          'A conflict occurred (likely sequence out of sync for sl_no). Run this in Supabase SQL editor, then retry:\n\n' +
          "select setval(\n  pg_get_serial_sequence('mis_records','sl_no'),\n  coalesce((select max(sl_no) from mis_records), 0) + 1,\n  false\n);"
        );
      }
      toast({ title: 'Import complete', description: `Inserted ${inserted}, skipped ${skipped}, failed ${failed}${hadConflict ? ' (conflicts detected)' : ''}` });
      if (inserted > 0) onSuccess();
    } catch (e: any) {
      toast({ title: 'Import failed', description: e?.message || 'Unknown error', variant: 'destructive' });
    }
  }

  const sampleHeader = REQUIRED_HEADERS.join(',');
  const sampleRow = '2025-02-01,ACME INC,C001,P001,Project Alpha,100000,40000,0,0,Security,60000';

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-4xl w-[1000px]">
        <DialogHeader>
          <DialogTitle>Add MIS Records via CSV</DialogTitle>
          <DialogDescription>
            Upload CSV to insert rows into mis_records. Required headers (exclude sl_no):
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 w-[820px] break-words">
          <div className="text-sm p-3 rounded-md bg-muted whitespace-pre-wrap break-words">
            <div className="break-words"><span className="font-medium">Headers:</span> {sampleHeader}</div>
            <div className="mt-2 break-words"><span className="font-medium">Sample row:</span> {sampleRow}</div>
            <ul className="list-disc ml-5 mt-3 space-y-1">
              <li>sl_no is ignored. Database will auto-assign.</li>
              <li>rev_month format: YYYY-MM-DD (YYYY-MM auto-fills day as 01; dd-mm-yyyy allowed).</li>
              <li>Numbers only in revenue, approved_cost, unapproved_lead_count, unapproved_lead_cost, margin.</li>
              <li>Duplicates are skipped silently using rev_month+customer_id+project_id.</li>
              <li>Authentication not required for import.</li>
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

          {conflictInfo && (
            <div className="text-sm p-3 rounded-md bg-red-100 text-red-800 whitespace-pre-wrap">
              {conflictInfo}
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


