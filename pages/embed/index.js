import { useEffect, useState } from 'react';
import { Plus, Trash2, CheckSquare, Square } from 'lucide-react';

export default function Embed() {
  const [wsId, setWsId] = useState('demo');
  const [userName, setUserName] = useState('');
  const [members, setMembers] = useState([]);
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  const enmarcado = typeof window !== 'undefined' && window.top !== window;

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const id = p.get('workspace_id') || 'demo';
    const name = p.get('user_name') || '';
    const memberStr = p.get('members');
    setWsId(id);
    setUserName(name);
    try {
      if (memberStr) setMembers(JSON.parse(memberStr));
    } catch {}
  }, []);

  useEffect(() => {
    if (!enmarcado) return;
    const notify = () =>
      window.parent.postMessage(
        { type: 'wlo-resize', height: document.body.scrollHeight + 40 },
        '*'
      );
    notify();
    const ro = new ResizeObserver(notify);
    ro.observe(document.body);
    return () => ro.disconnect();
  }, [enmarcado]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!wsId) return;
    fetchItems();
  }, [wsId]);

  async function fetchItems() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/items?workspace_id=${encodeURIComponent(wsId)}`);
      const data = await res.json();
      if (res.ok) setItems(data);
      else setError(data.message || 'Error cargando items');
    } catch (e) {
      setError('Error cargando items');
    } finally {
      setLoading(false);
    }
  }

  async function addItem() {
    if (!newItem.trim()) return;
    setError('');
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: wsId,
          title: newItem.trim(),
          completed: false,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setItems([data, ...items]);
        setNewItem('');
      } else {
        setError(data.message || 'Error agregando item');
      }
    } catch (e) {
      setError('Error agregando item');
    }
  }

  async function deleteItem(id) {
    setError('');
    try {
      const res = await fetch(`/api/items?id=${id}&workspace_id=${encodeURIComponent(wsId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) setItems(items.filter((i) => i.id !== id));
      else setError(data.message || 'Error borrando item');
    } catch (e) {
      setError('Error borrando item');
    }
  }

  async function toggleItem(id, completed) {
    setError('');
    try {
      const res = await fetch(`/api/items?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: wsId,
          completed: !completed,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Error actualizando');
      } else {
        setItems(
          items.map((i) => (i.id === id ? { ...i, completed: !completed } : i))
        );
      }
    } catch (e) {
      setError('Error actualizando item');
    }
  }

  async function handleKey(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem();
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans">
      <div className="mx-auto max-w-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">SLF - Lista Simple</h1>
            <p className="text-sm text-gray-500">
              Workspace: <span className="font-medium">{wsId}</span>
              {userName && (
                <>
                  {' '}
                  · Usuario: <span className="font-medium">{userName}</span>
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={fetchItems}
            className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
            title="Recargar"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h5M4 4l5 5M4 4l5-5"
              />
            </svg>
          </button>
        </div>

        {/* New item */}
        <form onSubmit={(e) => { e.preventDefault(); addItem(); }} className="flex gap-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Escribe una tarea y presiona Enter..."
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newItem.trim()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="rounded-md bg-red-50 p-2 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="py-6 text-center text-sm text-gray-400">Cargando...</div>
        ) : items.length === 0 ? (
          <div className="py-6 text-center text-sm text-gray-400">
            No hay tareas. Agrega una arriba.
          </div>
        ) : (
          <ul className="space-y-1">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2"
              >
                <button
                  type="button"
                  onClick={() => toggleItem(item.id, item.completed)}
                  className="rounded p-1 text-gray-500 hover:bg-gray-100"
                >
                  {item.completed ? (
                    <CheckSquare className="h-4 w-4 text-green-600" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
                <span
                  className={
                    'flex-1 text-sm ' +
                    (item.completed ? 'line-through text-gray-400' : 'text-gray-700')
                  }
                >
                  {item.title}
                </span>
                <button
                  type="button"
                  onClick={() => deleteItem(item.id)}
                  className="rounded p-1 text-red-500 hover:bg-red-100"
                  title="Borrar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <p className="text-xs text-gray-400">
          Miembros: {members.length > 0 ? members.map((m) => m.name || m).join(', ') : 'ninguno'}
        </p>
      </div>

      {/* Installation banner (standalone) */}
      {!enmarcado && wsId === 'demo' && mounted && (
        <div className="fixed inset-x-0 bottom-4 mx-auto max-w-2xl rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 shadow-lg">
          <div className="font-semibold">Herramienta instalada correctamente</div>
          <div className="mt-1 space-y-1">
            <p>
              <span className="font-medium">URL base:</span>{' '}
              <code className="rounded bg-blue-100 px-1.5 py-0.5">{window.location.origin}</code>
            </p>
            <p>
              <span className="font-medium">Ruta embed:</span> <code className="rounded bg-blue-100 px-1.5 py-0.5">/embed</code>
            </p>
            <p>
              <span className="font-medium">Tipo:</span> Pantalla (embed)
            </p>
            <p>
              <span className="font-medium">Permisos:</span> Ninguno requerido
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
