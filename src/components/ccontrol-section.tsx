import { useRef, useState } from "react";
import ccontrolVideo from "@/assets/ccontrol-video.mp4.asset.json";

export function CControlSection() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [muted, setMuted] = useState(true);

  function toggleSound() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    if (!v.muted) void v.play();
    setMuted(v.muted);
  }

  return (
    <section id="ccontrol" className="cc-sec">
      <style>{`
.cc-sec{background:linear-gradient(160deg,#1a0b33 0%,#2a1152 55%,#1a0b33 100%);padding:64px 24px;position:relative;overflow:hidden;z-index:1}
.cc-sec::before{content:"";position:absolute;width:520px;height:520px;border-radius:50%;background:radial-gradient(circle,rgba(168,85,247,.28),transparent 65%);top:-180px;right:-120px;pointer-events:none}
.cc-inner{max-width:1080px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;position:relative}
.cc-eyebrow{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#d8b4fe;font-weight:600}
.cc-inner h2{color:#fff;font-size:clamp(26px,3vw,40px);margin:12px 0 14px;font-weight:700;line-height:1.15}
.cc-inner p{color:#d6c8ef;font-size:15px;line-height:1.65;max-width:460px}
.cc-list{list-style:none;padding:0;margin:18px 0 0;display:grid;gap:10px}
.cc-list li{display:flex;gap:10px;align-items:center;color:#e9e0f8;font-size:14px}
.cc-list li span{width:20px;height:20px;border-radius:50%;background:rgba(168,85,247,.22);color:#d8b4fe;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0}
.cc-media{position:relative;border-radius:22px;overflow:hidden;border:1px solid rgba(196,141,253,.35);box-shadow:0 30px 70px -30px rgba(168,85,247,.7);background:#120722}
.cc-media video{display:block;width:100%;height:auto}
.cc-sound{position:absolute;right:12px;bottom:12px;border:none;cursor:pointer;background:rgba(26,11,51,.7);color:#f3e8ff;border-radius:99px;padding:8px 14px;font-size:12px;font-weight:600;backdrop-filter:blur(6px)}
.cc-cta{display:inline-flex;align-items:center;justify-content:center;margin-top:26px;padding:15px 34px;border-radius:99px;font-weight:800;letter-spacing:.04em;color:#fff;text-decoration:none;background:linear-gradient(135deg,#7c3aed,#a855f7);box-shadow:0 0 18px rgba(168,85,247,.75),0 0 46px rgba(168,85,247,.45),inset 0 0 12px rgba(255,255,255,.22);border:1px solid rgba(216,180,254,.75);animation:ccLed 2.4s ease-in-out infinite;transition:transform .25s}
.cc-cta:hover{transform:translateY(-2px)}
.cc-cta:active{transform:scale(.97)}
@keyframes ccLed{0%,100%{box-shadow:0 0 14px rgba(168,85,247,.6),0 0 34px rgba(168,85,247,.32),inset 0 0 10px rgba(255,255,255,.18)}50%{box-shadow:0 0 26px rgba(216,180,254,.95),0 0 70px rgba(168,85,247,.6),inset 0 0 16px rgba(255,255,255,.3)}}
@media (prefers-reduced-motion: reduce){.cc-cta{animation:none}}
@media(max-width:820px){.cc-inner{grid-template-columns:1fr;gap:26px}.cc-sec{padding:44px 16px}}
      `}</style>
      <div className="cc-inner">
        <div>
          <small className="cc-eyebrow">CCONTROL</small>
          <h2>Agendas e controle financeiro para pequenos e médios negócios</h2>
          <p>
            O CCONTROL organiza a agenda da sua equipe e o financeiro do seu negócio em uma
            única ferramenta simples, rápida e feita para o dia a dia de quem vende e atende.
          </p>
          <ul className="cc-list">
            <li>
              <span>✓</span> Agenda de compromissos e atendimentos
            </li>
            <li>
              <span>✓</span> Controle de entradas, saídas e fluxo de caixa
            </li>
            <li>
              <span>✓</span> Relatórios claros para decidir com segurança
            </li>
          </ul>
          <a
            className="cc-cta"
            href="https://ccontrol.com.br"
            target="_blank"
            rel="noopener noreferrer"
          >
            Conheça agora
          </a>
        </div>
        <div className="cc-media">
          <video
            ref={videoRef}
            src={ccontrolVideo.url}
            autoPlay
            muted
            loop
            playsInline
            controls
            preload="metadata"
          />
          <button type="button" className="cc-sound" onClick={toggleSound}>
            {muted ? "🔇 Ativar som" : "🔊 Som ligado"}
          </button>
        </div>
      </div>
    </section>
  );
}