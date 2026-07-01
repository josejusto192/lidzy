"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, XCircle, Info } from "lucide-react"

interface AlertDialogCustomProps {
  open: boolean
  onClose: () => void
  title: string
  message: string
  type?: "success" | "error" | "warning" | "info"
  details?: string
  actionLabel?: string
  onAction?: () => void
}

export function AlertDialogCustom({ open, onClose, title, message, type = "info", details, actionLabel, onAction }: AlertDialogCustomProps) {
  const icons = {
    success: <CheckCircle className="h-6 w-6 text-green-500" />,
    error: <XCircle className="h-6 w-6 text-red-500" />,
    warning: <AlertCircle className="h-6 w-6 text-yellow-500" />,
    info: <Info className="h-6 w-6 text-blue-500" />,
  }

  const colors = {
    success: "bg-green-500/10 border-green-500/20",
    error: "bg-red-500/10 border-red-500/20",
    warning: "bg-yellow-500/10 border-yellow-500/20",
    info: "bg-blue-500/10 border-blue-500/20",
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`rounded-full p-2 ${colors[type]}`}>{icons[type]}</div>
            <DialogTitle className="text-lg">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-left whitespace-pre-wrap">{message}</DialogDescription>
          {details && (
            <div className="mt-4 rounded-lg bg-muted p-3 text-left">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{details}</p>
            </div>
          )}
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Fechar
          </Button>
          {actionLabel && onAction && (
            <Button onClick={() => { onClose(); onAction() }} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
              {actionLabel}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
