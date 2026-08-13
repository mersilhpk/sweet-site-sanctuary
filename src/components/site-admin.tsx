import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  adminLogin,
  adminLogout,
  adminStatus,
  requestUpload,
  saveMedia,
  removeMedia,
  listProjectsAdmin,
  saveProject,
  deleteProject,
  listClientsAdmin,
  saveClient,
  deleteClient,
} from "@/lib/admin.functions";

export type MediaItem = { url: string; mediaType: "image" | "video" };
export type MediaMap = Record<string, MediaItem>;

export const MODEL_SLOTS = ["modelo_1", "modelo_2", "modelo_3", "modelo_4"];
export const CLIENT_SLOTS = Array.from({ length: 10 }, (_, i) => `cliente_${i + 1}`);
export const SERVICE_SLOTS = Array.from({ length: 5 }, (_, i) => `servico_${i + 1}`);

export function mediaUrl(path: string) {
  return `/api/public/media/${path}`;
}

export function useSiteMedia() {
  const [media, setMedia] = useState<MediaMap>({});

  const load = useCallback(async () => {
    const { data } = await supabase.from("site_media").select("slot,url,media_type");
    if (!data) return;
    const next: MediaMap = {};
    for (const row of data as Array<{ slot: string; url: string; media_type: string }>) {
      next[row.slot] = {
        url: mediaUrl(row.url),
        mediaType: row.media_type === "video" ? "video" : "image",
      };
    }
    setMedia(next);
    for (const [slot, item] of Object.entries(next)) {
      if (slot.startsWith("modelo_") && item.mediaType === "image") {
        const preload = new Image();
        preload.decoding = "async";
        preload.src = item.url;
      }
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { media, reload: load };
}

type SlotGroup = { title: string; slots: string[]; hint: string };

type ProjectRow = {
  id: string;
  name: string;
  image_url: string | null;
  media_type: string;
  site_url: string | null;
  description: string | null;
  extra_info: string | null;
  sort_order: number;
  active: boolean;
};

type ClientRow = {
  id: string;
  name: string;
  logo_url: string | null;
  media_type: string;
  site_url: string | null;
  sort_order: number;
  active: boolean;
};

async function uploadFile(slot: string, file: File) {
  const ext = file.name.split(".").pop() ?? "bin";
  const up = await requestUpload({ data: { slot, ext } });
  const { error } = await supabase.storage
    .from(up.bucket)
    .uploadToSignedUrl(up.path, up.token, file, { contentType: file.type });
  if (error) throw error;
  return { path: up.path, mediaType: file.type.startsWith("video") ? "video" : "image" };
}

function ProjectsManager({ onChanged }: { onChanged: () => void }) {
  const [rows, setRows] = useState<ProjectRow[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await listProjectsAdmin();
    setRows(res.items as ProjectRow[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function patch(id: string, changes: Partial<ProjectRow>) {
    setRows((list) => list.map((r) => (r.id === id ? { ...r, ...changes } : r)));
  }

  async function persist(row: ProjectRow) {
    setBusy(true);
    try {
      await saveProject({ data: row });
      await load();
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function create() {
    setBusy(true);
    try {
      await saveProject({ data: { name: "Novo projeto", sort_order: rows.length + 1 } });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function upload(row: ProjectRow, file: File) {
    setBusy(true);
    try {
      const up = await uploadFile(`projeto_${row.id.slice(0, 8)}`, file);
      await saveProject({ data: { ...row, image_url: up.path, media_type: up.mediaType } });
      await load();
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="cw-admin-group">
      <h4>Modelos de site (projetos)</h4>
      <p>Cadastre quantos projetos quiser. Ordem menor aparece primeiro.</p>
      {rows.map((row) => (
        <div key={row.id} className="cw-admin-row">
          <input
            value={row.name}
            placeholder="Nome do projeto"
            onChange={(e) => patch(row.id, { name: e.target.value })}
          />
          <input
            value={row.site_url ?? ""}
            placeholder="https://site-do-projeto.com.br"
            onChange={(e) => patch(row.id, { site_url: e.target.value })}
          />
          <textarea
            rows={2}
            value={row.description ?? ""}
            placeholder="Descrição"
            onChange={(e) => patch(row.id, { description: e.target.value })}
          />
          <textarea
            rows={3}
            value={row.extra_info ?? ""}
            placeholder="Informações adicionais (uma por linha)"
            onChange={(e) => patch(row.id, { extra_info: e.target.value })}
          />
          <div className="cw-admin-row-actions">
            <label>
              Ordem
              <input
                type="number"
                style={{ width: 70 }}
                value={row.sort_order}
                onChange={(e) => patch(row.id, { sort_order: Number(e.target.value) })}
              />
            </label>
            <label>
              <input
                type="checkbox"
                checked={row.active}
                onChange={(e) => patch(row.id, { active: e.target.checked })}
              />
              Ativo
            </label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void upload(row, f);
                e.target.value = "";
              }}
            />
            <button type="button" disabled={busy} onClick={() => void persist(row)}>
              Salvar
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                await deleteProject({ data: { id: row.id } });
                await load();
                onChanged();
              }}
            >
              Excluir
            </button>
          </div>
        </div>
      ))}
      <button type="button" className="cw-admin-primary" disabled={busy} onClick={() => void create()}>
        Adicionar projeto
      </button>
    </section>
  );
}

function ClientsManager({ onChanged }: { onChanged: () => void }) {
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await listClientsAdmin();
    setRows(res.items as ClientRow[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function patch(id: string, changes: Partial<ClientRow>) {
    setRows((list) => list.map((r) => (r.id === id ? { ...r, ...changes } : r)));
  }

  async function upload(row: ClientRow, file: File) {
    setBusy(true);
    try {
      const up = await uploadFile(`cliente_${row.id.slice(0, 8)}`, file);
      await saveClient({ data: { ...row, logo_url: up.path, media_type: up.mediaType } });
      await load();
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="cw-admin-group">
      <h4>Clientes CakeWeb (logos)</h4>
      <p>As logos mantêm a proporção original. Ordem menor aparece primeiro.</p>
      {rows.map((row) => (
        <div key={row.id} className="cw-admin-row">
          <input
            value={row.name}
            placeholder="Nome do cliente"
            onChange={(e) => patch(row.id, { name: e.target.value })}
          />
          <div className="cw-admin-row-actions">
            <label>
              Ordem
              <input
                type="number"
                style={{ width: 70 }}
                value={row.sort_order}
                onChange={(e) => patch(row.id, { sort_order: Number(e.target.value) })}
              />
            </label>
            <label>
              <input
                type="checkbox"
                checked={row.active}
                onChange={(e) => patch(row.id, { active: e.target.checked })}
              />
              Ativo
            </label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void upload(row, f);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await saveClient({ data: row });
                  await load();
                  onChanged();
                } finally {
                  setBusy(false);
                }
              }}
            >
              Salvar
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                await deleteClient({ data: { id: row.id } });
                await load();
                onChanged();
              }}
            >
              Excluir
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="cw-admin-primary"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await saveClient({ data: { name: "Novo cliente", sort_order: rows.length + 1 } });
            await load();
          } finally {
            setBusy(false);
          }
        }}
      >
        Adicionar cliente
      </button>
    </section>
  );
}

export function SiteAdmin({ onChanged }: { onChanged: () => void }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    adminStatus()
      .then((r) => setIsAdmin(r.admin))
      .catch(() => setIsAdmin(false));
  }, []);

  const groups = useMemo<SlotGroup[]>(
    () => [
      {
        title: "Vídeo do celular (início)",
        slots: ["hero_video"],
        hint: "Envie um vídeo (MP4) ou uma imagem vertical.",
      },
      {
        title: "Serviços (carrossel)",
        slots: SERVICE_SLOTS,
        hint: "Até 5 artes ou vídeos dos serviços.",
      },
    ],
    [],
  );

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy("login");
    try {
      const res = await adminLogin({ data: { username: user, password: pass } });
      if (res.ok) {
        setIsAdmin(true);
        setPass("");
      } else setError("Usuário ou senha inválidos.");
    } catch {
      setError("Não foi possível entrar. Tente novamente.");
    } finally {
      setBusy(null);
    }
  }

  async function handleUpload(slot: string, file: File) {
    setError("");
    setBusy(slot);
    try {
      const ext = file.name.split(".").pop() ?? "bin";
      const up = await requestUpload({ data: { slot, ext } });
      const { error: upErr } = await supabase.storage
        .from(up.bucket)
        .uploadToSignedUrl(up.path, up.token, file, { contentType: file.type });
      if (upErr) throw upErr;
      await saveMedia({
        data: {
          slot,
          path: up.path,
          mediaType: file.type.startsWith("video") ? "video" : "image",
        },
      });
      onChanged();
    } catch (err) {
      console.error(err);
      setError("Falha ao enviar o arquivo. Verifique o tamanho e tente novamente.");
    } finally {
      setBusy(null);
    }
  }

  async function handleRemove(slot: string) {
    setBusy(slot);
    try {
      await removeMedia({ data: { slot } });
      onChanged();
    } finally {
      setBusy(null);
    }
  }

  async function handleLogout() {
    await adminLogout();
    setIsAdmin(false);
    setOpen(false);
  }

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <>
      <button type="button" className="cw-admin-fab" onClick={() => setOpen(true)}>
        {isAdmin ? "Editar site" : "Admin"}
      </button>
      {open && (
        <div className="cw-admin-overlay" role="dialog" aria-modal="true">
          <div className="cw-admin-panel">
            <div className="cw-admin-head">
              <strong>{isAdmin ? "Painel de conteúdo" : "Acesso administrativo"}</strong>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar">
                ✕
              </button>
            </div>

            {!isAdmin ? (
              <form className="cw-admin-form" onSubmit={handleLogin}>
                <label>
                  Usuário
                  <input value={user} onChange={(e) => setUser(e.target.value)} autoComplete="username" />
                </label>
                <label>
                  Senha
                  <input
                    type="password"
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    autoComplete="current-password"
                  />
                </label>
                {error && <p className="cw-admin-error">{error}</p>}
                <button type="submit" className="cw-admin-primary" disabled={busy === "login"}>
                  {busy === "login" ? "Entrando..." : "Entrar"}
                </button>
              </form>
            ) : (
              <div className="cw-admin-body">
                {error && <p className="cw-admin-error">{error}</p>}
                {groups.map((g) => (
                  <section key={g.title} className="cw-admin-group">
                    <h4>{g.title}</h4>
                    <p>{g.hint}</p>
                    <div className="cw-admin-slots">
                      {g.slots.map((slot, i) => (
                        <div key={slot} className="cw-admin-slot">
                          <span>{g.slots.length > 1 ? `#${i + 1}` : "Arquivo"}</span>
                          <input
                            type="file"
                            accept="image/*,video/*"
                            disabled={busy === slot}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) void handleUpload(slot, f);
                              e.target.value = "";
                            }}
                          />
                          <button type="button" onClick={() => void handleRemove(slot)}>
                            Limpar
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
                <ProjectsManager onChanged={onChanged} />
                <ClientsManager onChanged={onChanged} />
                <button type="button" className="cw-admin-ghost" onClick={() => void handleLogout()}>
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>,
    document.body,
  );
}