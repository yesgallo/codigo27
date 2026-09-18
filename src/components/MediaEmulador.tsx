import React from 'react';

interface MediaEmuladorProps {
  url: string;
  formato: 'video' | 'audio' | 'texto';
}

const isYouTube = (url: string) => url.includes('youtube.com') || url.includes('youtu.be');
const isSpotify = (url: string) => url.includes('spotify.com');
const isDirectVideo = (url: string) => /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
const isDirectAudio = (url: string) => /\.(mp3|wav|ogg|aac|m4a|flac)(\?|$)/i.test(url);

export const MediaEmulador: React.FC<MediaEmuladorProps> = ({ url, formato }) => {
  if (!url) return null;

  // ── YouTube embed ──────────────────────────────────────────────────────
  if (isYouTube(url)) {
    let videoId = '';
    try {
      if (url.includes('youtu.be')) {
        videoId = url.split('.be/')[1].split('?')[0];
      } else {
        videoId = new URL(url).searchParams.get('v') || '';
      }
    } catch {
      return <div className="p-4 bg-gray-100 text-red-600 rounded text-sm">URL de YouTube inválida</div>;
    }
    return (
      <div className="relative w-full pb-[56.25%] h-0 rounded-lg overflow-hidden bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute top-0 left-0 w-full h-full border-0"
        />
      </div>
    );
  }

  // ── Spotify embed ──────────────────────────────────────────────────────
  if (isSpotify(url)) {
    try {
      const parts = url.split('spotify.com/')[1].split('?')[0];
      return (
        <div className="w-full rounded-lg overflow-hidden">
          <iframe
            src={`https://open.spotify.com/embed/${parts}?utm_source=generator`}
            width="100%"
            height="152"
            allowFullScreen
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="border-0"
          />
        </div>
      );
    } catch {
      return <div className="p-4 bg-gray-100 text-red-600 rounded text-sm">URL de Spotify inválida</div>;
    }
  }

  // ── Archivo de video directo (subido a Storage) ────────────────────────
  if (formato === 'video' || isDirectVideo(url)) {
    return (
      <div className="w-full rounded-lg overflow-hidden bg-black">
        <video
          controls
          className="w-full max-h-[500px]"
          preload="metadata"
        >
          <source src={url} />
          Tu navegador no soporta la reproducción de video.
        </video>
      </div>
    );
  }

  // ── Archivo de audio directo (subido a Storage) ────────────────────────
  if (formato === 'audio' || isDirectAudio(url)) {
    return (
      <div className="w-full bg-gray-900 rounded-lg p-6 flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#E63946] rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          </div>
          <span className="text-white text-sm font-bold uppercase tracking-widest">Audio</span>
        </div>
        <audio controls className="w-full" preload="metadata">
          <source src={url} />
          Tu navegador no soporta la reproducción de audio.
        </audio>
      </div>
    );
  }

  // ── Enlace genérico ────────────────────────────────────────────────────
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-red-600 hover:underline flex items-center gap-2 p-4 bg-gray-50 rounded border border-gray-200 text-sm"
    >
      🔗 Enlace multimedia adjunto
    </a>
  );
};
