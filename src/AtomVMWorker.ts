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

    try {
      const exports = atomVmInstance.exports as any;
      const memory = exports.memory as WebAssembly.Memory;

      // 1. Serialize payload
      const encoder = new TextEncoder();
      const payloadStr = JSON.stringify(payload);
      const payloadBytes = encoder.encode(payloadStr);

      // 2. Allocate memory in WASM
      const ptr = exports.alloc(payloadBytes.length);
      const mem = new Uint8Array(memory.buffer);
      mem.set(payloadBytes, ptr);

      // 3. Execute WASM function
      const resPtr = exports.execute(ptr, payloadBytes.length);

      // 4. Read null-terminated string result from WASM memory
      let resLen = 0;
      const resMem = new Uint8Array(memory.buffer, resPtr);
      while (resMem[resLen] !== 0) {
        resLen++;
      }
      
      const resBytes = new Uint8Array(memory.buffer, resPtr, resLen);
      const decoder = new TextDecoder();
      const resStr = decoder.decode(resBytes);

      // 5. Deallocate memory
      exports.dealloc(ptr, payloadBytes.length);
      exports.dealloc(resPtr, resLen + 1);

      // 6. Deserialize result
      const result = JSON.parse(resStr);
      self.postMessage({ type: 'EXECUTE_SUCCESS', result });
    } catch (err) {
      self.postMessage({ type: 'EXECUTE_ERROR', error: String(err) });
    }
  }
};
