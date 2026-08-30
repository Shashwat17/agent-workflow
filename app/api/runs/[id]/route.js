import { getRun } from "@/lib/server/run-service";

export async function GET(_request, { params }) {
  const run = getRun(params.id);

  if (!run) {
    return Response.json(
      { success: false, message: "Run not found" },
      { status: 404 },
    );
  }

  return Response.json({ success: true, data: run });
}
