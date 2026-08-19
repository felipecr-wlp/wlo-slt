'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Form, FormField } from '@slt/shared-types';

export function FormBuilder({ form }: { form: Form }) {
  const [title, setTitle] = useState(form.title);
  const [groupName, setGroupName] = useState(form.group_name);
  const [status, setStatus] = useState(form.status);
  const [emailTo, setEmailTo] = useState((form.routing?.email_to as string) || '');
  const [emailSubject, setEmailSubject] = useState((form.routing?.email_subject as string) || '');
  const [emailBody, setEmailBody] = useState((form.routing?.email_body as string) || '');
  const [notify, setNotify] = useState(!!form.routing?.email_notify);
  const [fields, setFields] = useState<Array<FormField>>(form.fields || []);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const save = () => {
    setSaving(true);
    setMsg('');
    fetch(`/api/forms/${form.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        group_name: groupName,
        status,
        routing: {
          ...form.routing,
          email_notify: notify,
          email_to: emailTo,
          email_subject: emailSubject,
          email_body: emailBody,
        },
        fields,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        setSaving(false);
        setMsg(d.error ? `Error: ${d.error}` : 'Guardado ok');
      })
      .catch(() => setSaving(false));
  };

  const addField = () => setFields([...fields, { type: 'text', label: '', name: '', required: false }]);
  const updateField = (i: number, patch: Partial<FormField>) =>
    setFields(fields.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  const removeField = (i: number) => setFields(fields.filter((_, j) => j !== i));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Editor: {form.id}</h1>
        <Badge variant={status === 'active' ? 'default' : 'secondary'}>{status}</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle>General</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div><Label>Titulo</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div><Label>Grupo</Label><Input value={groupName} onChange={(e) => setGroupName(e.target.value)} /></div>
          <div className="flex items-end">
            <Label className="mb-1 block">Status</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Form['status'])}
              className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 dark:bg-gray-900"
            >
              <option value="active">Activo</option>
              <option value="archived">Archivado</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Campos</CardTitle>
          <Button variant="outline" onClick={addField}>+ Campo</Button>
        </CardHeader>
        <CardContent>
          {fields.map((f, i) => (
            <div key={i} className="grid gap-2 md:grid-cols-5 items-end space-y-2 md:space-y-0 md:mb-3">
              <div>
                <Label>Tipo</Label>
                <select
                  value={f.type}
                  onChange={(e) => updateField(i, { type: e.target.value as FormField['type'] })}
                  className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 dark:bg-gray-900"
                >
                  <option value="text">Texto</option>
                  <option value="email">Email</option>
                  <option value="tel">Tel</option>
                  <option value="textarea">Area</option>
                  <option value="select">Select</option>
                  <option value="checkbox">Checkbox</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
              <div><Label>Label</Label><Input value={f.label} onChange={(e) => updateField(i, { label: e.target.value })} /></div>
              <div><Label>Name</Label><Input value={f.name} onChange={(e) => updateField(i, { name: e.target.value })} /></div>
              <div className="flex items-center h-10 mt-6 gap-2">
                <input type="checkbox" checked={!!f.required} onChange={(e) => updateField(i, { required: e.target.checked })} />
                <Label className="mb-0">Required</Label>
              </div>
              <div><Button variant="ghost" onClick={() => removeField(i)}>x</Button></div>
            </div>
          ))}
          {fields.length === 0 && <p className="text-sm text-gray-500">Sin campos. Agrege uno.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Notificacion por email</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
            Enviar notificacion
          </label>
          <div><Label>Para</Label><Input value={emailTo} onChange={(e) => setEmailTo(e.target.value)} placeholder="ventas@ejemplo.com" /></div>
          <div><Label>Asunto</Label><Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} /></div>
          <div><Label>Plantilla HTML</Label><Textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={5} /></div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</Button>
        {msg && <span className="text-sm">{msg}</span>}
      </div>
    </div>
  );
}