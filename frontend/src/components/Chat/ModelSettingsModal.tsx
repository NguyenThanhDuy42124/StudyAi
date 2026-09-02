import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Settings, Cpu, Key } from "lucide-react"

export interface ModelConfig {
  provider: string
  model: string
  api_key: string
}

interface ModelSettingsModalProps {
  onSave: (config: ModelConfig) => void
  currentConfig: ModelConfig
}

export function ModelSettingsModal({ onSave, currentConfig }: ModelSettingsModalProps) {
  const [open, setOpen] = useState(false)
  const [config, setConfig] = useState<ModelConfig>(currentConfig)

  // Sync state if external changes
  useEffect(() => {
    setConfig(currentConfig)
  }, [currentConfig])

  const handleSave = () => {
    onSave(config)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button 
          className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 hover:bg-muted text-muted-foreground transition-all"
          title="Cấu hình Model & API Key"
        >
          <Settings className="h-5 w-5" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary" />
            Cấu hình AI Model
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Provider (Nhà cung cấp)</label>
            <select 
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50"
              value={config.provider}
              onChange={(e) => setConfig({ ...config, provider: e.target.value })}
            >
              <option value="nvidia">NVIDIA NIM</option>
              <option value="gemini">Google Gemini</option>
              <option value="groq">Groq</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tên Model</label>
            <input 
              type="text" 
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50"
              value={config.model}
              onChange={(e) => setConfig({ ...config, model: e.target.value })}
              placeholder="VD: meta/llama-3.3-70b-instruct"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Key className="h-4 w-4" /> API Key (Ghi đè)
            </label>
            <input 
              type="password" 
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50"
              value={config.api_key}
              onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
              placeholder="Dán API Key của bạn vào đây..."
            />
            <p className="text-xs text-muted-foreground">
              Nếu để trống, hệ thống sẽ sử dụng Key mặc định trong cài đặt môi trường (.env).
            </p>
          </div>
        </div>
        <div className="flex justify-end pt-4 border-t">
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-all"
          >
            Lưu Cấu Hình & Test
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
