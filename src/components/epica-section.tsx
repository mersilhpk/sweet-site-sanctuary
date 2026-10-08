import { useRef, useState } from "react";
import { ArrowUpRight, MapPin, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import videoAsset from "@/assets/epica-creative.mp4.asset.json";
import posterAsset from "@/assets/epica-poster.jpg.asset.json";

const locationUrl = "https://www.google.com/maps?rlz=1C1VDKB_enBR1139BR1139&gs_lcrp=EgZjaHJvbWUyCggAEEUYFhgeGDkyBwgBEAAYgAQyCggCEAAYgAQYogQyBwgDEAAY7wUyBwgEEAAY7wUyBggFEEUYPNIBCDIyOTVqMGo3qAIAsAIA&um=1&ie=UTF-8&fb=1&gl=br&sa=X&geocode=KVW5Xxv7McaUMRPsD8zooFUy&daddr=Av.+Fran%C3%A7a,+207+-+Cidade+Alta,+Piracicaba+-+SP,+13416-520";

export function EpicaSection() {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [error, setError] = useState(false);

  function togglePlayback() {
    const element = video.current;
    if (!element) return;
    if (element.paused) void element.play().catch(() => setPlaying(false));
    else element.pause();
  }

  return (
    <section id="epica" className="epica-section" aria-labelledby="epica-title">
      <div className="epica-film">
        <video ref={video} src={videoAsset.url} poster={posterAsset.url} autoPlay muted={muted} loop playsInline preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => setError(true)} aria-label="Apresentação da sede da Épica Creative" />
        <div className="epica-film-caption"><span>CAKEWEB × ÉPICA CREATIVE</span><span>CRIATIVIDADE EM MOVIMENTO</span></div>
        <div className="epica-video-controls">
          <Button variant="ghost" size="icon" onClick={togglePlayback} aria-label={playing ? "Pausar vídeo da Épica" : "Reproduzir vídeo da Épica"} title={playing ? "Pausar" : "Reproduzir"}>{playing ? <Pause /> : <Play />}</Button>
          <Button variant="ghost" size="icon" onClick={() => setMuted((value) => !value)} aria-label={muted ? "Ativar som da Épica" : "Silenciar vídeo da Épica"} title={muted ? "Ativar som" : "Silenciar"}>{muted ? <VolumeX /> : <Volume2 />}</Button>
        </div>
        {error && <p className="epica-video-error" role="status">Não foi possível carregar o vídeo da Épica.</p>}
      </div>
      <div className="epica-content">
        <div className="epica-heading">
          <span className="epica-kicker">PARCEIRA CRIATIVA</span>
          <h2 id="epica-title">ÉPICA<span>CREATIVE</span></h2>
          <p className="epica-tagline">Parceira estratégica de criatividade, marca e posicionamento.</p>
        </div>
        <div className="epica-copy">
          <span className="epica-index">01 / UNIÃO CRIATIVA</span>
          <p>A Épica Creative é a empresa em união criativa com a <strong>CakeWeb.</strong></p>
          <p>Integrando um ecossistema completo para sua empresa: <strong>estratégia, branding, comunicação, marketing e posicionamento de mercado</strong> para transformar negócios em marcas mais fortes, relevantes e que geram resultados concretos.</p>
          <Button asChild className="epica-location"><a href={locationUrl} target="_blank" rel="noopener noreferrer"><MapPin />Onde estamos localizados<ArrowUpRight /></a></Button>
          <address>Av. França, 207 · Cidade Alta<br />Piracicaba · SP</address>
        </div>
        <ul className="epica-disciplines" aria-label="Áreas de atuação da Épica">
          {["Estratégia", "Branding", "Comunicação", "Marketing", "Posicionamento"].map((item, index) => <li key={item}><span className="epica-discipline-number">0{index + 1}</span><span>{item}</span><span className="epica-plus" aria-hidden="true">+</span></li>)}
        </ul>
      </div>
    </section>
  );
}