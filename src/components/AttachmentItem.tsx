import { Download, FileText, LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getAttachmentBlob, type Attachment } from '../api'

const formatSize = (bytes: number) =>
  bytes < 1024 ? `${bytes} B` : bytes < 1024 ** 2 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 ** 2).toFixed(1)} MB`

export function AttachmentItem({ ticketId, attachment }: { ticketId: string; attachment: Attachment }) {
  const isImage = attachment.contentType.startsWith('image/')
  const [url, setUrl] = useState<string | null>(null)
  const [state, setState] = useState<'idle' | 'loading' | 'error'>(isImage ? 'loading' : 'idle')

  async function load() {
    setState('loading')
    try {
      const blob = await getAttachmentBlob(ticketId, attachment.id)
      setState('idle')
      return URL.createObjectURL(blob)
    } catch {
      setState('error')
      return null
    }
  }

  // Las imágenes se descargan al montar para la vista previa; el resto, solo al pulsar.
  useEffect(() => {
    if (!isImage) return
    let objectUrl: string | null = null
    let cancelled = false
    getAttachmentBlob(ticketId, attachment.id).then(
      (blob) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
        setState('idle')
      },
      () => !cancelled && setState('error'),
    )
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [isImage, ticketId, attachment.id])

  async function download() {
    const href = url ?? (await load())
    if (!href) return
    const a = Object.assign(document.createElement('a'), { href, download: attachment.fileName })
    a.click()
    if (!url) setTimeout(() => URL.revokeObjectURL(href), 1000)
  }

  return (
    <li className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      {isImage && (
        <a href={url ?? undefined} target="_blank" rel="noreferrer" className="grid h-40 place-items-center bg-slate-100">
          {url ? <img src={url} alt={attachment.fileName} className="h-full w-full object-contain" />
            : state === 'error' ? <span className="text-sm text-red-600">No se pudo cargar</span>
            : <LoaderCircle className="size-5 animate-spin text-slate-400" aria-label="Cargando" />}
        </a>
      )}
      <div className="flex items-center gap-2 p-2 text-sm">
        {!isImage && <FileText className="size-5 shrink-0 text-slate-400" aria-hidden />}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium" title={attachment.fileName}>{attachment.fileName}</p>
          <p className="text-xs text-slate-500">
            {formatSize(attachment.sizeBytes)}{state === 'error' && !isImage && <span className="text-red-600"> · Error al descargar</span>}
          </p>
        </div>
        <button onClick={download} disabled={state === 'loading'} aria-label={`Descargar ${attachment.fileName}`}
          className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40">
          {state === 'loading' && !isImage ? <LoaderCircle className="size-4 animate-spin" /> : <Download className="size-4" />}
        </button>
      </div>
    </li>
  )
}
