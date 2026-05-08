import React from 'react';

interface MediaEmuladorProps {
  url: string;
  formato: 'video' | 'audio' | 'texto';
}

export const MediaEmulador: React.FC<MediaEmuladorProps> = ({ url, formato }) => {
  if (!url) return null;

  if (formato === 'video' && url.includes('youtube.com') || url.includes('youtu.be')) {
    // Extract video ID safely
    let videoId = '';
    try {
      if (url.includes('youtu.be')) {
        videoId = url.split('.be/')[1].split('?')[0];
      } else {
        const urlObj = new URL(url);
        videoId = urlObj.searchParams.get('v') || '';
      }
    } catch {
      return <div className="p-4 bg-gray-100 text-red-600 rounded">URL de YouTube inválida</div>;
    }

    return (
      <div className="relative w-full pb-[56.25%] h-0 rounded-lg overflow-hidden bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute top-0 left-0 w-full h-full border-0"
        ></iframe>
      </div>
    );
  }

  if (formato === 'audio' && url.includes('spotify.com')) {
    // Extract track/episode ID
    // expecting format: https://open.spotify.com/episode/... or https://open.spotify.com/track/...
    try {
      const parts = url.split('spotify.com/')[1].split('?')[0];
      return (
        <div className="w-full h-[152px] rounded-lg overflow-hidden bg-black">
           <iframe 
            src={`https://open.spotify.com/embed/${parts}?utm_source=generator`} 
            width="100%" 
            height="152" 
            allowFullScreen 
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
            loading="lazy"
            className="border-0"
          ></iframe>
        </div>
      );
    } catch {
       return <div className="p-4 bg-gray-100 text-red-600 rounded">URL de Spotify inválida</div>;
    }
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline flex items-center gap-2 p-4 bg-gray-50 rounded border border-gray-200">
      Enlace multimedia adjunto
    </a>
  );
};
