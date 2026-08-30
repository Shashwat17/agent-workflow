import { createWorkflow, getAllWorkflows } from "@/lib/server/workflow-service";
import { workflowSchema } from "@/lib/server/validation";

export async function GET() {
  const workflows = getAllWorkflows();

  return Response.json({
    success: true,
    data: workflows,
    meta: { total: workflows.length },
  });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));

  const result = workflowSchema.safeParse(body);

  if (!result.success) {
    return Response.json(
      {
        success: false,
        message: "Invalid workflow payload",
        errors: result.error.flatten(),
      },
      { status: 400 },
    );
  }

  const workflow = createWorkflow(result.data);

  return Response.json(
    {
      success: true,
      data: workflow,
    },
    { status: 201 },
  );
}
