import {useEffect, useMemo} from 'react';

let modelViewerLoaded = false;

type Model3dSource = {
  url: string;
  format?: string | null;
  mimeType?: string | null;
  filesize?: number | null;
};

export function ProductModel3D({
  sources,
  alt,
  interactive = true,
  arButtonLabel = 'View in your room',
}: {
  sources: Model3dSource[];
  alt?: string | null;
  interactive?: boolean;
  arButtonLabel?: string;
}) {
  useEffect(() => {
    if (modelViewerLoaded) return;
    modelViewerLoaded = true;
    import('@google/model-viewer');
  }, []);

  const src = useMemo(
    () => sources.find((s) => s.mimeType === 'model/gltf-binary' || s.format === 'GLB')?.url,
    [sources],
  );
  const iosSrc = useMemo(
    () =>
      sources.find((s) => s.mimeType === 'model/vnd.usdz+zip' || s.format === 'USDZ')?.url,
    [sources],
  );

  if (!src) return null;

  return (
    <div className="pdp-model3d">
      <model-viewer
        src={src}
        ios-src={iosSrc}
        alt={alt ?? '3D model'}
        camera-controls={interactive ? true : undefined}
        disable-zoom={interactive ? undefined : true}
        auto-rotate={interactive ? true : undefined}
        interaction-prompt={interactive ? 'auto' : 'none'}
        ar
        ar-modes="webxr scene-viewer quick-look"
        ar-scale="auto"
        ar-placement="floor"
        shadow-intensity="1"
        exposure="1"
        environment-image="neutral"
        loading="eager"
        reveal="auto"
        style={{width: '100%', height: '100%', pointerEvents: interactive ? 'auto' : 'none'}}
      >
        {interactive && (
          <button slot="ar-button" className="pdp-model3d-ar-btn" type="button">
            <i className="ti ti-augmented-reality" /> {arButtonLabel}
          </button>
        )}
      </model-viewer>
    </div>
  );
}
