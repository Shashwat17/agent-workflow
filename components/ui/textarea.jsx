import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef(({ className, value, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-[80px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-500 aria-invalid:bg-red-50 focus:aria-invalid:border-red-500",
      className,
    )}
    ref={ref}
    {...props}
    value={value ?? ""}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
