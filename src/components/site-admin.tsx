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
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { media, reload: load };
}

type SlotGroup = { title: string; slots: string[]; hint: string };

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
        title: "Modelos de site (notebook)",
        slots: MODEL_SLOTS,
        hint: "Uma imagem ou vídeo para cada modelo exibido no notebook.",
      },
      {
        title: "Clientes CakeWeb (carrossel)",
        slots: CLIENT_SLOTS,
        hint: "Até 10 fotos que giram automaticamente.",
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