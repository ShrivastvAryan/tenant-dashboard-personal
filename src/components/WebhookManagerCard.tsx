"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Loader2, Plus, Save, Trash2 } from "lucide-react";
import {
  CreateWebhook,
  DeleteWebhook,
  GetWebhooks,
  UpdateWebhook,
  Webhook,
  WebhookEventType,
  WebhookPayload,
} from "@/actions/webhooks";
import { useDashboardSearch } from "@/hooks/useDashboardSearch";

const EVENTS: WebhookEventType[] = [
  "checkout_session.completed",
  "checkout_session.expired",
  "checkout_session.canceled",
];

const emptyForm: WebhookPayload = {
  name: "",
  url: "",
  secret: "",
  event_types: ["checkout_session.completed"],
  is_active: true,
};

function WebhookForm({
  value,
  onChange,
  submitLabel,
  onSubmit,
  loading,
}: {
  value: WebhookPayload;
  onChange: (value: WebhookPayload) => void;
  submitLabel: string;
  onSubmit: () => void;
  loading: boolean;
}) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 rounded-2xl border border-[var(--color-stroke)] bg-white p-4">
      <label className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-[#64748b]">
          Name
        </span>
        <input
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          className="h-11 rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#9daffa]"
          placeholder="Payment events"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-[#64748b]">
          Endpoint URL
        </span>
        <input
          value={value.url}
          onChange={(e) => onChange({ ...value, url: e.target.value })}
          className="h-11 rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#9daffa]"
          placeholder="https://example.com/webhooks/dashx"
        />
      </label>

      <label className="flex flex-col gap-2 xl:col-span-2">
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-[#64748b]">
          Secret
        </span>
        <input
          value={value.secret}
          onChange={(e) => onChange({ ...value, secret: e.target.value })}
          className="h-11 rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#9daffa]"
          placeholder="whsec_..."
        />
      </label>

      <div className="xl:col-span-2 flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-[#64748b]">
          Events
        </span>
        <div className="flex flex-wrap gap-2">
          {EVENTS.map((eventType) => {
            const checked = value.event_types.includes(eventType);
            return (
              <button
                key={eventType}
                type="button"
                onClick={() =>
                  onChange({
                    ...value,
                    event_types: checked
                      ? value.event_types.filter((item) => item !== eventType)
                      : [...value.event_types, eventType],
                  })
                }
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  checked
                    ? "border-[#9daffa] bg-[#f1f5fb] text-[#0f172a]"
                    : "border-[var(--color-stroke)] bg-white text-[#64748b]"
                }`}
              >
                {eventType}
              </button>
            );
          })}
        </div>
      </div>

      <div className="xl:col-span-2 flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-[#0f172a]">
          <input
            type="checkbox"
            checked={value.is_active}
            onChange={(e) => onChange({ ...value, is_active: e.target.checked })}
            className="h-4 w-4 rounded border-[var(--color-stroke)]"
          />
          Active
        </label>

        <button
          type="button"
          onClick={onSubmit}
          disabled={loading || !value.name || !value.url || !value.secret}
          className="inline-flex items-center gap-2 rounded-xl bg-[#4166fb] px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

export default function WebhookManagerCard() {
  const { query } = useDashboardSearch();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [newWebhook, setNewWebhook] = useState<WebhookPayload>(emptyForm);
  const [editing, setEditing] = useState<Record<string, WebhookPayload>>({});

  async function loadWebhooks() {
    setLoading(true);
    setError("");
    const res = await GetWebhooks();
    if (res.success) {
      const items = res.data || [];
      setWebhooks(items);
      setEditing(
        Object.fromEntries(
          items.map((item) => [
            item.id,
            {
              name: item.name,
              url: item.url,
              secret: item.secret,
              event_types: item.event_types,
              is_active: item.is_active,
            },
          ])
        )
      );
    } else {
      setError(res.error || "Failed to load webhooks");
    }
    setLoading(false);
  }

  useEffect(() => {
    loadWebhooks();
  }, []);

  const filteredWebhooks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return webhooks;
    return webhooks.filter((webhook) =>
      [webhook.name, webhook.url, webhook.secret]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(normalizedQuery)
        )
    );
  }, [query, webhooks]);

  async function handleCreate() {
    setCreating(true);
    setError("");
    const res = await CreateWebhook(newWebhook);
    if (!res.success) {
      setError(res.error || "Failed to create webhook");
      setCreating(false);
      return;
    }
    setNewWebhook(emptyForm);
    await loadWebhooks();
    setCreating(false);
  }

  async function handleUpdate(id: string) {
    const form = editing[id];
    if (!form) return;
    setSaving(true);
    setError("");
    const res = await UpdateWebhook(id, form);
    if (!res.success) {
      setError(res.error || "Failed to update webhook");
      setSaving(false);
      return;
    }
    await loadWebhooks();
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this webhook?")) return;
    setSaving(true);
    setError("");
    const res = await DeleteWebhook(id);
    if (!res.success) {
      setError(res.error || "Failed to delete webhook");
      setSaving(false);
      return;
    }
    await loadWebhooks();
    setSaving(false);
  }

  async function copySecret(secret: string, id: string) {
    await navigator.clipboard.writeText(secret);
    setCopiedId(id);
    setTimeout(() => setCopiedId(""), 1500);
  }

  return (
    <div className="flex flex-col gap-5 rounded-3xl border border-[var(--color-stroke)] bg-[#f8fafc] p-5 overflow-hidden">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-[#0f172a]">Webhooks</h2>
        <p className="text-sm text-[#64748b]">
          Create and manage up to five webhook endpoints for payment status events.
        </p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <WebhookForm
        value={newWebhook}
        onChange={setNewWebhook}
        submitLabel="Create webhook"
        onSubmit={handleCreate}
        loading={creating}
      />

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-[#0f172a]">
          <Plus size={14} />
          Existing endpoints
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-[#64748b]">
            <Loader2 size={14} className="animate-spin" />
            Loading webhooks...
          </div>
        ) : filteredWebhooks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-stroke)] bg-white p-6 text-sm text-[#64748b]">
            {query ? "No webhooks match this search" : "No webhooks configured yet."}
          </div>
        ) : (
          filteredWebhooks.map((webhook) => {
            const form = editing[webhook.id];
            if (!form) return null;

            return (
              <div
                key={webhook.id}
                className="flex flex-col gap-3 rounded-2xl border border-[var(--color-stroke)] bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3 flex-col sm:flex-row">
                  <div className="flex flex-col gap-1">
                    <span className="text-base font-semibold text-[#0f172a]">
                      {webhook.name}
                    </span>
                    <span className="text-xs text-[#64748b] break-all">
                      Created {new Date(webhook.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        form.is_active
                          ? "bg-[#e7f9ed] text-[#059669]"
                          : "bg-[#fef2f2] text-[#dc2626]"
                      }`}
                    >
                      {form.is_active ? "Active" : "Paused"}
                    </span>
                    <button
                      onClick={() => copySecret(form.secret, webhook.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-stroke)] px-2.5 py-1.5 text-xs font-medium text-[#0f172a]"
                    >
                      {copiedId === webhook.id ? (
                        <Check size={12} className="text-[#05bb5c]" />
                      ) : (
                        <Copy size={12} />
                      )}
                      Secret
                    </button>
                    <button
                      onClick={() => handleDelete(webhook.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#fecaca] bg-[#fff5f5] px-2.5 py-1.5 text-xs font-medium text-[#dc2626]"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </div>
                </div>

                <WebhookForm
                  value={form}
                  onChange={(value) =>
                    setEditing((current) => ({ ...current, [webhook.id]: value }))
                  }
                  submitLabel="Save changes"
                  onSubmit={() => handleUpdate(webhook.id)}
                  loading={saving}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
