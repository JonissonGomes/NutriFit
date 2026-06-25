import { useCallback, useRef, useState } from 'react'
import { Upload, FileIcon, ImageIcon, X } from 'lucide-react'

export interface FileDropzoneProps {
  files: File[]
  onChange: (files: File[]) => void
  accept?: string
  multiple?: boolean
  maxFiles?: number
  maxSizeMB?: number
  label?: string
  hint?: string
  acceptedFormatsLabel?: string
  disabled?: boolean
  showPreviews?: boolean
  icon?: 'image' | 'file' | 'any'
}

const FileDropzone = ({
  files,
  onChange,
  accept,
  multiple = false,
  maxFiles = 5,
  maxSizeMB = 10,
  label = 'Arraste arquivos aqui ou clique para selecionar',
  hint,
  acceptedFormatsLabel,
  disabled = false,
  showPreviews = true,
  icon = 'any',
}: FileDropzoneProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const addFiles = useCallback(
    (incoming: File[]) => {
      if (disabled || incoming.length === 0) return
      const maxBytes = maxSizeMB * 1024 * 1024
      const valid = incoming.filter((f) => f.size <= maxBytes)
      const next = multiple ? [...files, ...valid] : valid.slice(0, 1)
      onChange(next.slice(0, maxFiles))
    },
    [disabled, files, maxFiles, maxSizeMB, multiple, onChange]
  )

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (disabled) return
    addFiles(Array.from(e.dataTransfer.files))
  }

  const removeAt = (index: number) => {
    onChange(files.filter((_, i) => i !== index))
  }

  const Icon = icon === 'image' ? ImageIcon : icon === 'file' ? FileIcon : Upload

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`relative rounded-xl border-2 border-dashed p-6 text-center transition-colors cursor-pointer ${
          disabled
            ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
            : dragOver
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 bg-gray-50/80 hover:border-primary-400 hover:bg-primary-50/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={(e) => {
            addFiles(Array.from(e.target.files || []))
            e.target.value = ''
          }}
        />
        <div className="flex flex-col items-center gap-2 pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
            <Icon className="h-6 w-6 text-primary-600" />
          </div>
          <p className="text-sm font-medium text-gray-800">{label}</p>
          {acceptedFormatsLabel ? (
            <p className="text-xs text-gray-500">Formatos aceitos: {acceptedFormatsLabel}</p>
          ) : null}
          {hint ? <p className="text-xs text-gray-500">{hint}</p> : null}
          <p className="text-xs text-gray-400">Máx. {maxFiles} arquivo(s) · até {maxSizeMB} MB cada</p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {showPreviews && files.some((f) => f.type.startsWith('image/')) ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {files.map((file, idx) =>
                file.type.startsWith('image/') ? (
                  <div key={`${file.name}-${idx}`} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                    />
                    <button
                      type="button"
                      onClick={() => removeAt(idx)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remover arquivo"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : null
              )}
            </div>
          ) : null}
          <ul className="space-y-1">
            {files.map((file, idx) => (
              <li
                key={`${file.name}-${file.size}-${idx}`}
                className="flex items-center justify-between gap-2 text-sm bg-white border border-gray-200 rounded-lg px-3 py-2"
              >
                <span className="truncate text-gray-700">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeAt(idx)}
                  className="text-gray-400 hover:text-red-600 shrink-0"
                  aria-label="Remover"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default FileDropzone
