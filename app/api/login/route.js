const OBSERVERS_AUDIENCE_ID = 'f0b41801-f6c5-4f20-8c8c-a9d2bb60471f';

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) return Response.json({ error: 'Email required' }, { status: 400 });

    // Fetch all contacts in the LCC Observers audience
    const res = await fetch(
      `https://api.resend.com/audiences/${OBSERVERS_AUDIENCE_ID}/contacts`,
      {
        headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
      }
    );

    if (!res.ok) {
      console.error('Resend fetch failed:', res.status);
      return Response.json({ error: 'Auth check failed' }, { status: 500 });
    }

    const { data: contacts } = await res.json();
    const found = contacts.some(
      (c) => c.email.toLowerCase() === email.toLowerCase() && !c.unsubscribed
    );

    if (!found) {
      return Response.json({ error: 'Not authorized' }, { status: 401 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('Login error:', err);
    return Response.json({ error: 'Login failed' }, { status: 500 });
  }
}
