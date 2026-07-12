/// <reference lib="webworker" />

import initWasm from './assets/AtomVM_bridge.wasm?init';

let atomVmInstance: WebAssembly.Instance | null = null;

self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data;
  
  if (type === 'INIT') {
    try {
      const instance = await initWasm({});
      atomVmInstance = instance;
      self.postMessage({ type: 'INIT_SUCCESS' });
    } catch (err) {
      self.postMessage({ type: 'INIT_ERROR', error: String(err) });
    }
  } else if (type === 'EXECUTE') {
    if (!atomVmInstance) {
      self.postMessage({ type: 'EXECUTE_ERROR', error: 'AtomVM not initialized' });
      return;
    }
    const result = { 
      success: true, 
      originalPayload: payload, 
      engine: 'Erlang VM (WASM Mock)',
      timestamp: Date.now()
    };
    self.postMessage({ type: 'EXECUTE_SUCCESS', result });
  }
};
