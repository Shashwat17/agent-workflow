import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import { Controller, FormProvider, useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";

const Form = FormProvider;

const FormFieldContext = React.createContext({}, "FormFieldContext");

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  return {
    ...fieldState,
    ...fieldContext,
  };
};

const FormFieldSlot = React.forwardRef(({ ...props }, ref) => (
  <Slot ref={ref} {...props} />
));
FormFieldSlot.displayName = "FormFieldSlot";

const FormField = ({ ...props }) => (
  <FormFieldContext.Provider value={{ name: props.name }}>
    <Controller {...props} />
  </FormFieldContext.Provider>
);

const FormItemContext = React.createContext({}, "FormItemContext");

const FormItem = React.forwardRef(({ className, ...props }, ref) => (
  <FormItemContext.Provider value={{}}>
    <div ref={ref} className={cn("space-y-2", className)} {...props} />
  </FormItemContext.Provider>
));
FormItem.displayName = "FormItem";

const FormLabel = React.forwardRef(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField();

  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(
        "text-[10px] font-medium uppercase tracking-[0.24em] text-slate-500",
        error && "text-red-600",
        className,
      )}
      htmlFor={formItemId}
      {...props}
    />
  );
});
FormLabel.displayName = "FormLabel";

const FormControl = React.forwardRef(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField();

  return (
    <FormFieldSlot
      ref={ref}
      id={formItemId}
      className={cn(
        "has-[input[aria-invalid=true]]:border-red-500 has-[textarea[aria-invalid=true]]:border-red-500",
        className,
      )}
      aria-describedby={
        !error ? `${formItemId}-description` : `${formItemId}-form-item-error`
      }
      aria-invalid={!!error}
      {...props}
    />
  );
});
FormControl.displayName = "FormControl";

const FormDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
FormDescription.displayName = "FormDescription";

const FormMessage = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    const { error, formItemId } = useFormField();
    const body = error ? String(error?.message) : children;

    if (!body) {
      return null;
    }

    return (
      <p
        ref={ref}
        id={`${formItemId}-form-item-error`}
        className={cn("text-sm font-medium text-red-600", className)}
        {...props}
      >
        {body}
      </p>
    );
  },
);
FormMessage.displayName = "FormMessage";

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
};
