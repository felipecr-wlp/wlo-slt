export async function GET() {
  return Response.json({ status: 'ok', service: 'wlo-slt', t: new Date().toISOString() });
}
