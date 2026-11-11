import { useMemo, useState } from 'react';
import type { ColDef } from 'ag-grid-community';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { AdminDataGrid } from '@/components/admin/AdminDataGrid';
import { type RowAction } from '@/components/admin/RowActionsCell';
import { BulkUploadDialog } from '@/components/admin/BulkUploadDialog';
import { StepperSheet, type WizardStep } from '@/components/admin/StepperSheet';
import ImagePicker from '@/components/admin/ImagePicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { withToast } from '@/lib/apiToast';
import { cn } from '@/lib/utils';
import type { BulkUploadResult } from '@/types/bulkUpload';

export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'switch' | 'image' | 'time';
export interface Field {
  key: string; label: string; type: FieldType; step: string; required?: boolean;
  min?: number; max?: number; maxLength?: number; options?: string[]; hint?: string;
}
type Row = { id: number } & Record<string, unknown>;
type Form = Record<string, unknown> & { id?: number };

/** Generic admin CRUD over one Cafe Kathaa entity: AdminDataGrid + StepperSheet form + compulsory bulk upload. */
export default function KathaaCrudTab<T extends Row>({
  entity, queryKey, list, create, update, remove, bulk, fields, columns, empty, bulkColumns, bulkSample, extraValidate,
}: {
  entity: string; queryKey: string; list: () => Promise<T[]>;
  create: (body: Form) => Promise<unknown>; update: (id: number, body: Form) => Promise<unknown>;
  remove: (id: number) => Promise<void>; bulk: (f: File) => Promise<BulkUploadResult>;
  fields: Field[]; columns: ColDef<T>[]; empty: Form; bulkColumns: string[]; bulkSample: string[];
  extraValidate?: (f: Form) => string[];
}) {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ['admin-kathaa', queryKey], queryFn: list });
  const [form, setForm] = useState<Form | null>(null);
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-kathaa', queryKey] });
    qc.invalidateQueries({ queryKey: ['kathaa'] });
  };
  const save = useMutation({
    mutationFn: (f: Form) =>
      f.id == null ? withToast(create(f), `${entity} created`) : withToast(update(f.id, f), `${entity} saved`),
    onSuccess: () => { invalidate(); setForm(null); },
  });
  const del = useMutation({
    mutationFn: (id: number) => withToast(remove(id), `${entity} removed`),
    onSuccess: invalidate,
  });

  const errors = useMemo(() => {
    if (!form) return {} as Record<string, string>;
    const e: Record<string, string> = {};
    for (const f of fields) {
      const v = form[f.key];
      if (f.required && (v == null || String(v).trim() === '')) e[f.key] = `${f.label} is required`;
      if (f.type === 'number' && v != null && String(v) !== '') {
        const n = Number(v);
        if (Number.isNaN(n)) e[f.key] = `${f.label} must be a number`;
        else if (f.min != null && n < f.min) e[f.key] = `${f.label} must be at least ${f.min}`;
        else if (f.max != null && n > f.max) e[f.key] = `${f.label} must be at most ${f.max}`;
      }
      if (f.type === 'time' && v && !/^([01]\d|2[0-3]):[0-5]\d$/.test(String(v))) e[f.key] = `${f.label} must be HH:mm`;
      if (f.maxLength && v && String(v).length > f.maxLength) e[f.key] = `${f.label} is too long`;
    }
    (extraValidate?.(form) ?? []).forEach((m, i) => { e[`_x${i}`] = m; });
    return e;
  }, [form, fields, extraValidate]);
  const canSave = form != null && Object.keys(errors).length === 0;

  const set = (k: string, v: unknown) => setForm((f) => (f ? { ...f, [k]: v } : f));
  const stepNames = Array.from(new Set(fields.map((f) => f.step)));

  const renderField = (f: Field) => {
    const v = form?.[f.key];
    const bad = !!errors[f.key];
    const cls = cn('mt-1', bad && 'border-destructive focus-visible:ring-destructive');
    return (
      <div key={f.key} className="space-y-1">
        {f.type === 'switch' ? (
          <div className="flex items-center gap-3">
            <Switch id={`f-${f.key}`} checked={!!v} onCheckedChange={(c) => set(f.key, c)} />
            <Label htmlFor={`f-${f.key}`}>{f.label}</Label>
          </div>
        ) : (
          <>
            <Label htmlFor={`f-${f.key}`}>{f.label}{f.required && ' *'}</Label>
            {f.type === 'textarea' && <Textarea id={`f-${f.key}`} className={cls} value={String(v ?? '')} onChange={(e) => set(f.key, e.target.value)} />}
            {(f.type === 'text' || f.type === 'time') && <Input id={`f-${f.key}`} className={cls} value={String(v ?? '')} placeholder={f.type === 'time' ? 'HH:mm' : undefined} onChange={(e) => set(f.key, e.target.value)} />}
            {f.type === 'number' && <Input id={`f-${f.key}`} type="number" inputMode="decimal" className={cls} value={v == null ? '' : String(v)} onChange={(e) => set(f.key, e.target.value === '' ? null : Number(e.target.value))} />}
            {f.type === 'select' && (
              <Select value={String(v ?? '')} onValueChange={(x) => set(f.key, x)}>
                <SelectTrigger id={`f-${f.key}`} className={cls}><SelectValue /></SelectTrigger>
                <SelectContent>{f.options?.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            )}
            {f.type === 'image' && <ImagePicker value={(v as string) ?? null} onChange={(url) => set(f.key, url || null)} />}
          </>
        )}
        {f.hint && <p className="text-xs text-muted-foreground">{f.hint}</p>}
      </div>
    );
  };

  const steps: WizardStep[] = form ? stepNames.map((s) => {
    const fs = fields.filter((f) => f.step === s);
    return {
      id: s, title: s, error: fs.some((f) => errors[f.key]), complete: fs.every((f) => !errors[f.key]),
      content: (
        <div className="space-y-4">
          {Object.keys(errors).length > 0 && (
            <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
              {Object.values(errors).map((m) => <p key={m}>{m}</p>)}
            </div>
          )}
          {fs.map(renderField)}
        </div>
      ),
    };
  }) : [];

  const actions: RowAction<T>[] = [
    { label: 'Edit', icon: Pencil, onClick: (row) => setForm({ ...(row as Form) }) },
    { label: 'Remove', icon: Trash2, danger: true, onClick: (row) => del.mutate(row.id) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <BulkUploadDialog title={`Bulk upload — ${entity}`} columns={bulkColumns} sampleRow={bulkSample}
          templateName={`kathaa-${queryKey}-template.csv`} onUpload={async (f) => { const r = await bulk(f); invalidate(); return r; }} />
        <Button onClick={() => setForm({ ...empty })}><Plus size={16} className="mr-1" /> New {entity.toLowerCase()}</Button>
      </div>
      <AdminDataGrid<T> rowData={data} columnDefs={columns} actions={actions} pagination pageSize={10}
        emptyMessage={`No ${entity.toLowerCase()} records yet.`} height="calc(100vh - 300px)" />
      <StepperSheet open={form != null} onOpenChange={(o) => !o && setForm(null)}
        title={form?.id == null ? `New ${entity.toLowerCase()}` : `Edit ${entity.toLowerCase()}`}
        steps={steps} canSave={canSave} saving={save.isPending} onSave={() => form && save.mutate(form)} />
    </div>
  );
}
