import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  jiraFormSchema,
  azureFormSchema,
  mcpFormSchema,
} from "@/lib/validation-schemas";

const TOOL_CATALOG = {
  jira: {
    id: "jira",
    label: "Jira",
    shortLabel: "JIRA",
    accent: "bg-cyan-500",
    accentSoft: "border-cyan-200 bg-cyan-50 text-cyan-700",
    description: "Project tracking, sprint planning, and issue coordination.",
    tab: "tools",
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
    tab: "tools",
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
  mcp: {
    id: "mcp",
    label: "MCP Connector",
    shortLabel: "MCP",
    accent: "bg-emerald-500",
    accentSoft: "border-emerald-200 bg-emerald-50 text-emerald-700",
    description:
      "Connect secure external MCP servers for tool discovery, execution, and shared context routing.",
    tab: "mcp",
    fields: [
      {
        key: "name",
        label: "Connector name",
        placeholder: "Internal MCP Gateway",
        type: "text",
      },
      {
        key: "url",
        label: "MCP server URL",
        placeholder: "https://mcp.company.com",
        type: "text",
      },
      {
        key: "transport",
        label: "Transport",
        placeholder: "streamable-http",
        type: "text",
      },
      {
        key: "namespace",
        label: "Namespace",
        placeholder: "ops-tools",
        type: "text",
      },
      {
        key: "token",
        label: "Access token",
        placeholder: "••••••••••••",
        type: "password",
      },
    ],
  },
};

const getValidationSchema = (toolId) => {
  if (toolId === "jira") return jiraFormSchema;
  if (toolId === "azure") return azureFormSchema;
  return mcpFormSchema;
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
  onTestConnection,
}) {
  const [activeTab, setActiveTab] = useState("tools");
  const [selectedTool, setSelectedTool] = useState("jira");

  const visibleTools = useMemo(
    () => Object.values(TOOL_CATALOG).filter((tool) => tool.tab === activeTab),
    [activeTab],
  );

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

  useEffect(() => {
    if (!visibleTools.some((tool) => tool.id === selectedTool)) {
      setSelectedTool(visibleTools[0]?.id ?? "jira");
    }
  }, [selectedTool, visibleTools]);

  if (!open) {
    return null;
  }

  const buildNormalizedPayload = (data) => ({
    id: selectedCatalog.id,
    label: selectedCatalog.label,
    shortLabel: selectedCatalog.shortLabel,
    status: "Connected",
    ...data,
  });

  const onSubmit = async (data) => {
    const normalized = buildNormalizedPayload(data);

    try {
      await onSaveTool?.(normalized);
      onOpenChange?.(false);
    } catch {
      form.setError("root", {
        message:
          "Connection failed. Check the API configuration and try again.",
      });
    }
  };

  const handleTestConnection = async () => {
    const values = form.getValues();
    const payload = buildNormalizedPayload(values);

    try {
      await onTestConnection?.(payload);
    } catch {
      form.setError("root", {
        message: "Connection test failed. Verify the endpoint and credentials.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl border-0 bg-transparent p-0 shadow-none sm:rounded-[30px]">
        <div className="flex max-h-[90vh] flex-col overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_35px_120px_rgba(15,23,42,0.18)]">
          <DialogHeader className="shrink-0 border-b border-slate-200 bg-slate-50 px-3 py-3 text-left sm:px-5 sm:py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.26em] text-slate-500">
                  Workspace integrations
                </p>
                <DialogTitle className="mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                  Connect tools
                </DialogTitle>
              </div>

              <button
                type="button"
                onClick={() => onOpenChange?.(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-lg text-slate-600 transition hover:bg-slate-100"
                aria-label="Close integrations panel"
              >
                ×
              </button>
            </div>
          </DialogHeader>

          <div className="shrink-0 border-b border-slate-200 bg-slate-50 px-3 py-3 sm:px-5">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1">
              {[
                { id: "tools", label: "Tools" },
                { id: "mcp", label: "MCP Connectors" },
              ].map((tab) => {
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id);
                      const nextTool = Object.values(TOOL_CATALOG).find(
                        (tool) => tool.tab === tab.id,
                      );
                      if (nextTool) setSelectedTool(nextTool.id);
                    }}
                    className={[
                      "flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-all",
                      isActive
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100",
                    ].join(" ")}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="max-h-[220px] overflow-y-auto border-b border-slate-200 bg-slate-50 p-3 sm:p-4 lg:max-h-none lg:border-b-0 lg:border-r">
              <div className="flex gap-3 overflow-x-auto pb-1 lg:flex-col lg:gap-3 lg:overflow-visible lg:pb-0">
                {visibleTools.map((tool) => {
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
                        "min-w-[220px] rounded-2xl border p-3 text-left transition-all lg:w-full",
                        isActive
                          ? "border-slate-900 bg-white shadow-[0_10px_25px_rgba(15,23,42,0.08)] ring-1 ring-slate-200"
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
                className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-5"
              >
                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
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
                </div>

                <DialogFooter className="relative mt-4 shrink-0 border-t border-slate-200 pt-4">
                  <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-h-[20px] items-center">
                      {form.formState.errors.root?.message && (
                        <p className="text-xs text-rose-600">
                          {form.formState.errors.root.message}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Secure token
                      </span>

                      <div className="flex flex-col gap-3 sm:flex-row">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full border-slate-300 bg-white text-slate-700 hover:bg-slate-50 sm:w-auto"
                          onClick={handleTestConnection}
                        >
                          Test connection
                        </Button>
                        <Button
                          type="submit"
                          className="w-full bg-slate-900 text-white hover:bg-slate-800 sm:w-auto"
                          disabled={form.formState.isSubmitting}
                        >
                          {form.formState.isSubmitting
                            ? "Connecting..."
                            : selectedCatalog.tab === "mcp"
                              ? "Connect connector"
                              : "Connect tool"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
