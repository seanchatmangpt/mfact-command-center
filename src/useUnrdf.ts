import { useEffect, useRef, useState, useCallback } from 'react';

// Simulates the unrdf Web Architect's layer
export function createBrowserKnowledgeEngine() {
  const worker = new Worker(new URL('./AtomVMWorker.ts', import.meta.url), { type: 'module' });
  
  return {
    init: () => {
      return new Promise((resolve, reject) => {
        worker.onmessage = (e) => {
          if (e.data.type === 'INIT_SUCCESS') resolve(true);
          else if (e.data.type === 'INIT_ERROR') reject(e.data.error);
        };
        worker.postMessage({ type: 'INIT' });
      });
    },
    execute: (payload: any) => {
      return new Promise((resolve, reject) => {
        worker.onmessage = (e) => {
          if (e.data.type === 'EXECUTE_SUCCESS') resolve(e.data.result);
          else if (e.data.type === 'EXECUTE_ERROR') reject(e.data.error);
        };
        worker.postMessage({ type: 'EXECUTE', payload });
      });
    },
    terminate: () => worker.terminate()
  };
}

export function useUnrdf() {
  const engineRef = useRef<ReturnType<typeof createBrowserKnowledgeEngine> | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const engine = createBrowserKnowledgeEngine();
    engineRef.current = engine;

    engine.init()
      .then(() => setIsReady(true))
      .catch((err) => setError(String(err)));

    return () => {
      engine.terminate();
    };
  }, []);

  const executeTelemetry = useCallback(async (data: any) => {
    if (!engineRef.current || !isReady) throw new Error("Engine not ready");
    return engineRef.current.execute(data);
  }, [isReady]);

  return { isReady, error, executeTelemetry };
}
