// Demo store en memoria (sin DB). Permite que crear/editar/submit funcionen en demo.
import type { Form, FormSubmission } from '@slt/shared-types';

const forms = new Map<string, Form>();
const submissions: FormSubmission[] = [];

export function upsertForm(f: Form): Form {
  forms.set(f.id, f);
  return f;
}
export function getForm(id: string): Form | undefined {
  return forms.get(id);
}
export function listForms(): Form[] {
  return Array.from(forms.values());
}

export function addSubmission(s: FormSubmission): FormSubmission {
  submissions.unshift(s);
  if (submissions.length > 100) submissions.pop();
  return s;
}
export function getRecentSubmissions(limit = 50): FormSubmission[] {
  return submissions.slice(0, limit);
}