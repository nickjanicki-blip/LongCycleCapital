export async function GET() {
  const key = process.env.RESEND_API_KEY;
  return Response.json({
    hasKey: !!key,
    keyPrefix: key ? key.slice(0, 8) + '...' : null,
    keyLength: key ? key.length : 0,
  });
}
