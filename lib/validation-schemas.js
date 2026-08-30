import { z } from "zod";

export const toolFormSchema = z.object({
  workspace: z.string().min(1, "Workspace name is required"),
  url: z.string().url("Please enter a valid URL"),
  email: z.string().email("Please enter a valid email"),
  project: z.string().min(1, "Project is required"),
  token: z.string().min(1, "Token is required"),
});

export const jiraFormSchema = z.object({
  workspace: z.string().min(1, "Workspace name is required"),
  url: z.string().url("Please enter a valid URL"),
  email: z.string().email("Please enter a valid email"),
  token: z.string().min(1, "API token is required"),
  project: z.string().min(1, "Project key is required"),
});

export const azureFormSchema = z.object({
  workspace: z.string().min(1, "Organization name is required"),
  url: z.string().url("Please enter a valid URL"),
  project: z.string().min(1, "Project name is required"),
  token: z.string().min(1, "PAT token is required"),
});

export const mcpFormSchema = z.object({
  name: z.string().min(1, "Connector name is required"),
  url: z.string().url("Please enter a valid MCP server URL"),
  transport: z.string().min(1, "Transport is required"),
  token: z.string().min(1, "Access token is required"),
  namespace: z.string().min(1, "Namespace is required"),
});

export const nodeFormSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  output: z.string().min(1, "Output is required"),
});
