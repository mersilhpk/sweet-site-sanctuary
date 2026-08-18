import { useEffect, useState } from "react";
import cakehubImage from "@/assets/cakehub-atendimentos.png.asset.json";
import { storageUrl, useSiteProjects } from "@/lib/site-content";

export function SiteShowcase() {
  const { projects } = useSiteProjects();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (idx > projects.length - 1) setIdx(0);
  }, [projects.length, idx]);

  // Pré-carrega todas as mídias para que a troca seja instantânea
  useEffect(() => {
    projects.forEach((p) => {
      if (p.image_url && p.media_type !== "video") {
        const img = new Image();
        img.decoding = "async";
        img.src = storageUrl(p.image_url);
      }
    });
  }, [projects]);

  const current = projects[idx];
  const total = projects.length;

  return (
    <div className="cw-showcase">
      <article className="cw-project-card">
        <div className="cw-project-label">
          <b>01</b>
          <span>Modelos de site</span>
        </div>

        <div className="cw-project-visual">
          {total > 1 && (
            <button
              type="button"
              className="cw-project-arrow cw-project-arrow--left"
              aria-label="Projeto anterior"
              onClick={() => setIdx((i) => (i - 1 + total) % total)}
            >
              ←
            </button>
          )}
          <div className="cw-laptop">
            <div className="cw-laptop-cam" />
            <div className="cw-laptop-screen">
              {projects.length ? (
                projects.map((p, i) =>
                  p.image_url ? (
                    <div
                      key={p.id}
                      className="cw-laptop-slide"
                      style={{
                        opacity: i === idx ? 1 : 0,
                        visibility: i === idx ? "visible" : "hidden",
                      }}
                      aria-hidden={i !== idx}
                    >
                      {p.media_type === "video" ? (
                        <video src={storageUrl(p.image_url)} autoPlay muted loop playsInline preload="auto" />
                      ) : (
                        <img
                          src={storageUrl(p.image_url)}
                          alt={`Modelo de site — ${p.name}`}
                          loading="eager"
                          decoding="async"
                          fetchPriority={i === idx ? "high" : "low"}
                        />
                      )}
                    </div>
                  ) : null,
                )
              ) : (
                <div className="cw-project-empty">
                  <span>Cadastre os projetos no painel administrativo</span>
                </div>
              )}
            </div>
            <div className="cw-laptop-base" />
          </div>
          {total > 1 && (
            <button
              type="button"
              className="cw-project-arrow cw-project-arrow--right"
              aria-label="Próximo projeto"
              onClick={() => setIdx((i) => (i + 1) % total)}
            >
              →
            </button>
          )}
        </div>

        {total > 1 && (
          <div className="cw-project-dots">
            {projects.map((p, i) => (
              <button
                key={p.id}
                type="button"
                className={i === idx ? "is-active" : ""}
                aria-label={`Ver ${p.name}`}
                onClick={() => setIdx(i)}
              />
            ))}
          </div>
        )}

        {current && (
          <div className="cw-project-info">
            <h3>{current.name}</h3>
            {current.description && <p>{current.description}</p>}
            {current.extra_info && (
              <ul>
                {current.extra_info
                  .split("\n")
                  .map((line) => line.trim())
                  .filter(Boolean)
                  .map((line, i) => (
                    <li key={i}>
                      <b>✓</b>
                      {line}
                    </li>
                  ))}
              </ul>
            )}
            {current.site_url && (
              <a
                className="cw-project-cta"
                href={current.site_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Acessar site →
              </a>
            )}
          </div>
        )}
      </article>

      <article className="cw-hub-card">
        <div className="cw-project-label">
          <b>02</b>
          <span>CakeHub · Atendimentos</span>
        </div>
        <div className="cw-hub-shot">
          <img
            src={cakehubImage.url}
            alt="CakeHub — central de atendimentos comerciais da CakeWeb"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="cw-hub-info">
          <small>OMNICHANNEL</small>
          <h3>Todos os canais em uma tela.</h3>
          <p>
            WhatsApp, Instagram e Facebook centralizados para sua equipe responder com contexto,
            histórico e próximo passo de cada oportunidade.
          </p>
          <ul>
            <li>
              <b>✓</b>WhatsApp, Instagram e Facebook unificados
            </li>
            <li>
              <b>✓</b>Histórico completo em cada contato
            </li>
            <li>
              <b>✓</b>Menos tempo trocando de telas
            </li>
          </ul>
        </div>
      </article>
    </div>
  );
}
