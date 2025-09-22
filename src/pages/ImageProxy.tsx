// This would be implemented as an API route in a real Next.js app
// For now, we'll create a client-side proxy that handles CORS
// In production, you'd want a proper server-side proxy

export async function handleImageProxy(src: string, quality?: string): Promise<Response> {
  try {
    // Allowlist of known manga CDNs
    const allowedHosts = [
      'cdn.mangadex.org',
      'uploads.mangadex.org',
      'api.mangadex.org',
      'comick.fun',
      'mangasee123.com',
      'mangakakalot.com',
      'mangapark.net',
      'apiconsumetorg-kappa.vercel.app'
    ];

    const url = new URL(src);
    if (!allowedHosts.some(host => url.hostname.includes(host))) {
      throw new Error('Host not allowed');
    }

    const response = await fetch(src, {
      headers: {
        'User-Agent': 'SoloToon/1.0',
        'Referer': url.origin
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    
    // Set cache headers
    const headers = new Headers({
      'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
      'Access-Control-Allow-Origin': '*'
    });

    return new Response(buffer, { headers });
  } catch (error) {
    console.error('Image proxy error:', error);
    
    // Return placeholder image
    const placeholderResponse = await fetch('/placeholder.svg');
    return new Response(await placeholderResponse.arrayBuffer(), {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  }
}

// Client-side image component that handles CORS
export function ProxiedImage({ 
  src, 
  alt, 
  className, 
  onError,
  ...props 
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  const proxiedSrc = src?.startsWith('http') 
    ? `/api/image?src=${encodeURIComponent(src)}`
    : src;

  return (
    <img
      {...props}
      src={proxiedSrc}
      alt={alt}
      className={className}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        if (!target.src.includes('placeholder.svg')) {
          target.src = '/placeholder.svg';
        }
        onError?.(e);
      }}
    />
  );
}