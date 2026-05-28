const AUDIENCE_ID = 'f0b41801-f6c5-4f20-8c8c-a9d2bb60471f'; // LCC Observers

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) return Response.json({ error: 'Email required' }, { status: 400 });

    await fetch(`https://api.resend.com/audiences/${AUDIENCE_ID}/contacts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        unsubscribed: false,
      }),
    }).catch(() => {});

    return Response.json({ success: true });
  } catch (err) {
    console.error('Observer tag error:', err);
    return Response.json({ error: 'Failed to tag observer' }, { status: 500 });
  }
}
