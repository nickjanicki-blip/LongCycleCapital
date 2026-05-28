const AUDIENCE_ID = '50e36a46-5b0e-4662-99c5-22aff770bbba'; // LCC Subscribers

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) return Response.json({ error: 'Email required' }, { status: 400 });

    // Add to audience
    await fetch(`https://api.resend.com/audiences/${AUDIENCE_ID}/contacts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, unsubscribed: false }),
    }).catch(() => {});

    // Send welcome email
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Long Cycle Capital <hello@longcyclecapital.com>',
        to: [email],
        subject: 'You\'re following the experiment.',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #2C3E50;">
            <p style="font-size: 16px; line-height: 1.6;">Thanks for signing up.</p>
            <p style="font-size: 16px; line-height: 1.6;">
              Long Cycle Capital is a self-managed fund exploring cycle-based macro investing.
              We publicly document our framework, our Cycle Compass readings, and our thinking.
              No predictions, no hype. Just the work.
            </p>
            <p style="font-size: 16px; line-height: 1.6;">
              You'll hear from us when we publish a new regime briefing or research note.
              In the meantime, feel free to explore the site.
            </p>
            <p style="font-size: 14px; margin-top: 32px; color: #2C3E50;">
              Nicholas Janicki<br>Long Cycle Capital
            </p>
          </div>
        `,
      }),
    }).catch(() => {});

    return Response.json({ success: true });
  } catch (err) {
    console.error('Subscribe error:', err);
    return Response.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}
