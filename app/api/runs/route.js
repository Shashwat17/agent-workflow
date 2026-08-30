import { createRun, getAllRuns } from "@/lib/server/run-service";
import { runSchema } from "@/lib/server/validation";

export async function GET() {
  const runs = getAllRuns();

  return Response.json({
    success: true,
    data: runs,
    meta: { total: runs.length },
  });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const result = runSchema.safeParse(body);

  if (!result.success) {
    return Response.json(
      {
        success: false,
        message: "Invalid run payload",
        errors: result.error.flatten(),
      },
      { status: 400 },
    );
  }

  const run = createRun(result.data);

  return Response.json(
    {
      success: true,
      data: run,
    },
    { status: 201 },
  );
}
