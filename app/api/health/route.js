export async function GET() {
  return Response.json({
    status: "ok",
    service: "agent-workflow-next-api",
    timestamp: new Date().toISOString(),
  });
}
