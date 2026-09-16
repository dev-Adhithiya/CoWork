import { X } from 'lucide-react';

export function InputAreaAttachments({ selectedFiles, imagePreviews, onRemove }: { selectedFiles: File[]; imagePreviews: string[]; onRemove: (index: number) => void }) {
  if (!selectedFiles.length) return null;
  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {selectedFiles.map((file, index) => (
        <div key={`${file.name}-${index}`} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70">
          {file.type.startsWith('image/') && <img src={imagePreviews[index]} alt="" className="w-8 h-8 rounded object-cover" />}
          <span className="max-w-32 truncate">{file.name}</span>
          <button type="button" onClick={() => onRemove(index)} className="p-1 rounded hover:bg-white/10" title="Remove file">
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
