import { getWorkflow } from "@/lib/server/workflow-service";

export async function GET(_request, { params }) {
  const workflow = getWorkflow(params.id);

  if (!workflow) {
    return Response.json(
      { success: false, message: "Workflow not found" },
      { status: 404 },
    );
  }

  return Response.json({ success: true, data: workflow });
}
