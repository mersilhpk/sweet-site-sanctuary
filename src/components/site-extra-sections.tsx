import { useEffect, useRef, useState } from "react";
import { CLIENT_SLOTS, SERVICE_SLOTS, type MediaMap } from "./site-admin";
import { CControlSection } from "./ccontrol-section";

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
  const clients = CLIENT_SLOTS.map((s) => ({ slot: s, item: media[s] }));
  const filledClients = clients.filter((c) => c.item);
  const track = filledClients.length ? [...filledClients, ...filledClients] : clients;

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
      <section id="clientes-cakeweb" className="cw-sec">
        <div className="cw-sec-inner">
          <small className="cw-eyebrow">CLIENTES</small>
          <h2>Clientes CakeWeb</h2>
          <p className="cw-sub">
            Operações que confiam na CakeWeb para estruturar e escalar o comercial.
          </p>
          <div className="cw-marquee" aria-label="Carrossel de clientes">
            <div className={`cw-marquee-track${filledClients.length ? " is-running" : ""}`}>
              {track.map((c, i) => (
                <div className="cw-client-card" key={`${c.slot}-${i}`}>
                  {c.item ? (
                    c.item.mediaType === "video" ? (
                      <video src={c.item.url} autoPlay muted loop playsInline />
                    ) : (
                      <img src={c.item.url} alt={`Cliente CakeWeb ${i + 1}`} loading="lazy" />
                    )
                  ) : (
                    <Placeholder label={`Cliente ${i + 1}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
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