import { build } from 'vite';

// Dedicated review build only. Production builds contain no camera override.
// Keep the real scene, shaders, rules and assets intact; expose observability
// from the same R3F store that renders the screenshots.
await build({
  build: { outDir: process.env.ART_QA_OUTDIR ?? 'dist/client' },
  plugins: [{
    name: 'art-qa-camera-observability',
    enforce: 'pre',
    transform(code, id) {
      if (!/\/src\/client\/scene\/(?:Board3D|CameraRig)\.tsx$/.test(id.replaceAll('\\', '/'))) return;
      const anchor = code.match(/const frame = cameraFrame\([^;]*\);/)?.[0];
      if (!anchor) return;
      return code.replace(anchor, `${anchor}
  const qaGl = useThree(s => s.gl);
  const qaScene = useThree(s => s.scene);
  useEffect(() => {
    const originalRender = qaGl.render;
    const renderSamples: { cpuSubmissionMs: number; intervalMs: number | null; phase: string | null }[] = [];
    let lastStart = 0;
    qaGl.render = (...args: Parameters<typeof qaGl.render>) => { const start = performance.now(); try { return originalRender.apply(qaGl, args); } finally { renderSamples.push({ phase: document.querySelector('[data-testid=board-3d]')?.getAttribute('data-phase') ?? null, cpuSubmissionMs: performance.now()-start, intervalMs: lastStart ? start-lastStart : null }); lastStart=start; if(renderSamples.length>240) renderSamples.shift(); } };
    const api = {
      getCamera: () => ({ position: camera.position.toArray(), target: controls.current?.target.toArray(), zoom: (camera as THREE.OrthographicCamera).zoom, up: camera.up.toArray() }),
      setCamera: (pose: { position: number[]; target: number[]; zoom: number; up: number[] }) => { userDrag.current = true; camera.position.fromArray(pose.position); camera.up.fromArray(pose.up); controls.current?.target.fromArray(pose.target); (camera as THREE.OrthographicCamera).zoom = pose.zoom; camera.updateProjectionMatrix(); controls.current?.update(); invalidate(); },
      render: () => { invalidate(); },
      stats: () => { const ctx = qaGl.getContext(); const debug = ctx.getExtension('WEBGL_debug_renderer_info'); const loadedModelNames: string[] = []; const mountedCharacters: string[] = []; qaScene.traverse(object => { if (object.name.startsWith('racer-model-') && object.getObjectByName('toy_hog-knight-hog')) mountedCharacters.push(object.name.slice(12)); if (object.name.startsWith('toy_')) loadedModelNames.push(object.name); }); return { renderTiming: { method: 'CPU time submitting actual WebGL scene; asynchronous GPU completion excluded; demand-mode intervals include intentional idle gaps', samples: renderSamples.slice() }, renderedFrames: qaGl.info.render.frame, calls: qaGl.info.render.calls, triangles: qaGl.info.render.triangles, geometries: qaGl.info.memory.geometries, textures: qaGl.info.memory.textures, environment: !!qaScene.environment, loadedModels: loadedModelNames.length, loadedModelNames, mountedCharacters, renderer: debug ? ctx.getParameter(debug.UNMASKED_RENDERER_WEBGL) : ctx.getParameter(ctx.RENDERER), pixelRatio: qaGl.getPixelRatio(), shadows: qaGl.shadowMap.enabled, toneMapping: qaGl.toneMapping, exposure: qaGl.toneMappingExposure, colorSpace: qaGl.outputColorSpace }; }
    };
    (window as unknown as { __ART_QA_SCENE__?: typeof api }).__ART_QA_SCENE__ = api;
    return () => { qaGl.render=originalRender; delete (window as unknown as { __ART_QA_SCENE__?: typeof api }).__ART_QA_SCENE__; };
  }, [camera, qaGl, invalidate]);`);
    },
  }],
});
