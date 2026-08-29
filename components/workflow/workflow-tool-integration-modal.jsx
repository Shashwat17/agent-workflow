import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { jiraFormSchema, azureFormSchema } from "@/lib/validation-schemas";

const TOOL_CATALOG = {
  jira: {
    id: "jira",
    label: "Jira",
    shortLabel: "JIRA",
    accent: "bg-cyan-500",
    accentSoft: "border-cyan-200 bg-cyan-50 text-cyan-700",
    description: "Project tracking, sprint planning, and issue coordination.",
    fields: [
      {
        key: "workspace",
        label: "Workspace name",
        placeholder: "Product Launch",
        type: "text",
      },
      {
        key: "url",
        label: "Jira URL",
        placeholder: "https://company.atlassian.net",
        type: "text",
      },
      {
        key: "email",
        label: "Email",
        placeholder: "you@company.com",
        type: "email",
      },
      {
        key: "token",
        label: "API token",
        placeholder: "••••••••••••",
        type: "password",
      },
      {
        key: "project",
        label: "Project key",
        placeholder: "PROJ",
        type: "text",
      },
    ],
  },
  azure: {
    id: "azure",
    label: "Azure DevOps",
    shortLabel: "AZURE",
    accent: "bg-violet-500",
    accentSoft: "border-violet-200 bg-violet-50 text-violet-700",
    description:
      "Boards, repos, and delivery pipelines across engineering teams.",
    fields: [
      {
        key: "workspace",
        label: "Organization name",
        placeholder: "contoso",
        type: "text",
      },
      {
        key: "url",
        label: "Azure DevOps URL",
        placeholder: "https://dev.azure.com/contoso",
        type: "text",
      },
      {
        key: "project",
        label: "Project name",
        placeholder: "Platform",
        type: "text",
      },
      {
        key: "token",
        label: "PAT token",
        placeholder: "••••••••••••",
        type: "password",
      },
    ],
  },
};

const getValidationSchema = (toolId) => {
  return toolId === "jira" ? jiraFormSchema : azureFormSchema;
};

const getEmptyFormData = (toolId) => {
  const fields = TOOL_CATALOG[toolId]?.fields ?? [];
  return fields.reduce((accumulator, field) => {
    accumulator[field.key] = "";
    return accumulator;
  }, {});
};

export function WorkflowToolIntegrationModal({
  open,
  onOpenChange,
  existingTools = [],
  onSaveTool,
}) {
  const [selectedTool, setSelectedTool] = useState("jira");

  const selectedCatalog = useMemo(
    () => TOOL_CATALOG[selectedTool] ?? TOOL_CATALOG.jira,
    [selectedTool],
  );

  const validationSchema = useMemo(
    () => getValidationSchema(selectedTool),
    [selectedTool],
  );

  const form = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: getEmptyFormData(selectedTool),
    mode: "onBlur",
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    form.reset(getEmptyFormData(selectedTool));
  }, [open, selectedTool, form]);

  if (!open) {
    return null;
  }

  const onSubmit = async (data) => {
    const normalized = {
      id: selectedCatalog.id,
      label: selectedCatalog.label,
      shortLabel: selectedCatalog.shortLabel,
      status: "Connected",
      ...data,
    };

    try {
      await onSaveTool?.(normalized);
      onOpenChange?.(false);
    } catch {
      form.setError("root", { message: "Connection failed. Check the API configuration and try again." });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_35px_120px_rgba(15,23,42,0.18)]">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.26em] text-slate-500">
              Workspace integrations
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
              Connect tools
            </h2>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange?.(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-lg text-slate-600 hover:bg-slate-100"
            aria-label="Close integrations panel"
          >
            ×
          </button>
        </div>

        <div className="grid h-[620px] grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="border-b border-slate-200 bg-slate-50 p-4 lg:border-b-0 lg:border-r">
            <div className="space-y-3">
              {Object.values(TOOL_CATALOG).map((tool) => {
                const isActive = selectedTool === tool.id;
                const isConnected = existingTools.some(
                  (connectedTool) => connectedTool.id === tool.id,
                );

                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => setSelectedTool(tool.id)}
                    className={[
                      "w-full rounded-2xl border p-3 text-left transition-all",
                      isActive
                        ? "border-slate-900 bg-white shadow-sm"
                        : "border-slate-200 bg-white/60 hover:border-slate-300 hover:bg-white",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span
                          className={[
                            "flex h-9 w-9 items-center justify-center rounded-xl text-[10px] font-bold text-white",
                            tool.accent,
                          ].join(" ")}
                        >
                          {tool.shortLabel}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {tool.label}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {isConnected ? "Connected" : "Not connected"}
                          </p>
                        </div>
                      </div>

                      {isConnected && (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.18em] text-emerald-700">
                          live
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col p-5"
            >
              <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <span
                    className={[
                      "flex h-10 w-10 items-center justify-center rounded-xl text-[10px] font-bold text-white",
                      selectedCatalog.accent,
                    ].join(" ")}
                  >
                    {selectedCatalog.shortLabel}
                  </span>
                  <div>
                    <p className="text-lg font-semibold text-slate-900">
                      {selectedCatalog.label}
                    </p>
                    <p className="text-sm text-slate-600">
                      {selectedCatalog.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {selectedCatalog.fields.map((field) => (
                  <FormField
                    key={field.key}
                    control={form.control}
                    name={field.key}
                    render={({ field: fieldProps }) => (
                      <FormItem
                        className={[
                          field.key === "url" || field.key === "workspace"
                            ? "md:col-span-2"
                            : "",
                        ].join(" ")}
                      >
                        <FormLabel>{field.label}</FormLabel>
                        <FormControl>
                          <Input
                            type={field.type}
                            placeholder={field.placeholder}
                            {...fieldProps}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-200 pt-5">
                {form.formState.errors.root?.message && (
                  <p className="text-xs text-rose-600">{form.formState.errors.root.message}</p>
                )}
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Secure token-based connection
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    onClick={() => onOpenChange?.(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-slate-900 text-white hover:bg-slate-800"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting
                      ? "Connecting..."
                      : "Connect tool"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
