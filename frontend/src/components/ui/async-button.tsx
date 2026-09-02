import { ButtonHTMLAttributes, forwardRef } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface AsyncButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
  loadingText?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

export const AsyncButton = forwardRef<HTMLButtonElement, AsyncButtonProps>(
  ({ children, isLoading, loadingText, disabled, variant = "default", size = "default", ...props }, ref) => {
    return (
      <Button
        ref={ref}
        disabled={isLoading || disabled}
        variant={variant}
        size={size}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isLoading && loadingText ? loadingText : children}
      </Button>
    )
  }
)

AsyncButton.displayName = "AsyncButton"
