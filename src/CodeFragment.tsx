
interface CodeFragmentProps {
  name: string;
  code: string;
  showGrid?: boolean;
  showDottedGrid?: boolean;
}

export function CodeFragment({
  name,
  code,
  showGrid = false,
  showDottedGrid = true,
}: CodeFragmentProps) {
  return (
    <div className="code-fragment-container">
      <div className="code-fragment-card">
        {showGrid && (
          <div className="bg-grid absolute-full"></div>
        )}
        {showDottedGrid && (
          <div className="bg-dotted absolute-full"></div>
        )}
        <div className="relative z-10 p-6 flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs text-secondary font-mono">
            <span>{name}</span>
            <span className="status-badge-small">Active</span>
          </div>
          <pre className="code-block font-mono text-sm overflow-x-auto">
            <code>{code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
