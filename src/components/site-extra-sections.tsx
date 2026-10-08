import { useEffect, useRef, useState } from "react";
import { SERVICE_SLOTS, type MediaMap } from "./site-admin";
import { CControlSection } from "./ccontrol-section";
import { Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";

function Placeholder({ label }: { label: string }) {
  return (
    <div className="cw-ph">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <path d="M3 15l5-4 4 3 3-2 6 5" />
      </svg>
      <span>{label}</span>
    </div>
  );
}

export function SiteExtraSections({ media }: { media: MediaMap }) {
  const services = SERVICE_SLOTS.map((s) => ({ slot: s, item: media[s] }));
  const [idx, setIdx] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    timer.current = window.setInterval(() => setIdx((i) => (i + 1) % services.length), 6000);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [services.length]);

  return (
    <>
      <CControlSection />
      <section id="clientes-cakeweb" className="cw-ecosystem" aria-label="CakeWeb e Épica no Instagram">
        <div className="cw-ecosystem-inner">
          <div className="cw-ecosystem-partners">
            <div className="cw-partner">
              <span className="cw-partner-index">01 / CAKEWEB</span>
              <h2>CakeWeb</h2>
              <p>IA, estrutura comercial e processos empresariais.</p>
              <Button asChild className="cw-instagram-link">
                <a href="https://www.instagram.com/cakeweb/" target="_blank" rel="noopener noreferrer" aria-label="Instagram da CakeWeb"><Instagram aria-hidden="true" />Instagram da CakeWeb</a>
              </Button>
            </div>
            <div className="cw-partner">
              <span className="cw-partner-index">02 / ÉPICA</span>
              <h2>Épica</h2>
              <p>Estratégia, branding, comunicação, marketing e posicionamento.</p>
              <Button asChild className="cw-instagram-link">
                <a href="https://www.instagram.com/epicacreative/" target="_blank" rel="noopener noreferrer" aria-label="Instagram da Épica"><Instagram aria-hidden="true" />Instagram da Épica</a>
              </Button>
            </div>
          </div>
          <p className="cw-ecosystem-led">Ecossistema completo para sua empresa crescer</p>
        </div>
      </section>

      <section id="servicos-galeria" className="cw-sec cw-sec--alt">
        <div className="cw-sec-inner">
          <small className="cw-eyebrow">PORTFÓLIO</small>
          <h2>Conheça alguns dos nossos serviços</h2>
          <p className="cw-sub">Artes, campanhas e entregas reais feitas para nossos clientes.</p>
          <div className="cw-carousel">
            <button
              type="button"
              className="cw-car-arrow"
              aria-label="Serviço anterior"
              onClick={() => setIdx((i) => (i - 1 + services.length) % services.length)}
            >
              ←
            </button>
            <div className="cw-car-stage">
              {services.map((s, i) => (
                <div className={`cw-car-item${i === idx ? " is-active" : ""}`} key={s.slot}>
                  {s.item ? (
                    s.item.mediaType === "video" ? (
                      <video src={s.item.url} autoPlay muted loop playsInline controls />
                    ) : (
                      <img src={s.item.url} alt={`Serviço CakeWeb ${i + 1}`} loading="lazy" />
                    )
                  ) : (
                    <Placeholder label={`Serviço ${i + 1}`} />
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              className="cw-car-arrow"
              aria-label="Próximo serviço"
              onClick={() => setIdx((i) => (i + 1) % services.length)}
            >
              →
            </button>
          </div>
          <div className="cw-dots">
            {services.map((s, i) => (
              <button
                key={s.slot}
                type="button"
                className={i === idx ? "is-active" : ""}
                aria-label={`Ir para o serviço ${i + 1}`}
                onClick={() => setIdx(i)}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}