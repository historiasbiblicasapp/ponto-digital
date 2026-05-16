import * as React from "react"
import { DialogContent, DialogOverlay } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface MobileDialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogContent> {
  fullMobile?: boolean
}

const MobileDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogContent>,
  MobileDialogContentProps
>(({ className, children, fullMobile = true, ...props }, ref) => (
  <DialogContent
    ref={ref}
    className={cn(
      // On mobile (< 640px): fullscreen
      // On sm+: centered dialog as usual
      fullMobile && [
        "fixed inset-0 z-50 m-0 h-dvh w-screen max-w-none rounded-none border-0 p-0",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        "sm:static sm:inset-auto sm:h-auto sm:w-full sm:max-w-lg sm:rounded-lg sm:border sm:p-6",
        "sm:data-[state=open]:slide-in-from-bottom-0",
        "sm:fixed sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%]",
        "sm:data-[state=closed]:slide-out-to-left-1/2 sm:data-[state=closed]:slide-out-to-top-[48%]",
        "sm:data-[state=open]:slide-in-from-left-1/2 sm:data-[state=open]:slide-in-from-top-[48%]",
      ],
      className,
    )}
    {...props}
  >
    {/* Scrollable content area for mobile */}
    <div className={cn(
      "flex flex-col h-full",
      fullMobile && "sm:h-auto",
    )}>
      {children}
    </div>
  </DialogContent>
))
MobileDialogContent.displayName = "MobileDialogContent"

export { MobileDialogContent }
export type { MobileDialogContentProps }
