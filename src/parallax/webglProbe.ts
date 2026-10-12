export function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    const gl = window.WebGLRenderingContext ? c.getContext('webgl2') || c.getContext('webgl') : null;
    // Release the probe context immediately; browsers cap how many can be alive.
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return Boolean(gl);
  } catch {
    return false;
  }
}
