import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

// Claves de primer nivel como filas; los strings se muestran crudos para que los stack traces conserven sus saltos de línea.
export function MetadataViewer({ json }: { json: string }) {
  const [copied, setCopied] = useState(false)
  let data: unknown
  try {
    data = JSON.parse(json)
  } catch {
    data = json
  }
  const pretty = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
  const entries = data && typeof data === 'object' && !Array.isArray(data) ? Object.entries(data) : null

  async function copy() {
    await navigator.clipboard.writeText(pretty)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="relative rounded-lg bg-slate-900 text-slate-100">
      <button onClick={copy} aria-label="Copiar metadata"
        className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-slate-700 px-2 py-1 text-xs hover:bg-slate-600">
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? 'Copiado' : 'Copiar'}
      </button>
      {entries ? (
        <dl className="divide-y divide-slate-800 font-mono text-xs">
          {entries.map(([key, value]) => (
            <div key={key} className="p-3 first:pr-24">
              <dt className="mb-1 text-pink-300">{key}</dt>
              <dd>
                <pre className="overflow-x-auto whitespace-pre-wrap break-words">
                  {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                </pre>
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <pre className="overflow-x-auto whitespace-pre-wrap break-words p-3 pr-24 font-mono text-xs">{pretty}</pre>
      )}
    </div>
  )
}
