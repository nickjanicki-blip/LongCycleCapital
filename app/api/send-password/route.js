export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) return Response.json({ error: 'Email required' }, { status: 400 });

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Long Cycle Capital <hello@longcyclecapital.com>',
        to: [email],
        subject: 'Your Observer access to Long Cycle Capital',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #2C3E50;">
            <p style="font-size: 16px; line-height: 1.6;">You have been granted Observer access to Long Cycle Capital.</p>
            <p style="font-size: 16px; line-height: 1.6;">Use the following password to log in at <a href="https://longcyclecapital.com/login" style="color: #1F4E78;">longcyclecapital.com/login</a>:</p>
            <div style="background: #f5f5f5; border-left: 4px solid #1F4E78; padding: 16px 20px; margin: 24px 0; font-size: 22px; font-weight: bold; letter-spacing: 0.05em; color: #1F4E78;">
              ${process.env.OBSERVER_PASSWORD}
            </div>
            <p style="font-size: 14px; line-height: 1.7; color: #7F8C8D;">Your email address is your username. The dashboard gives you access to the full Cycle Compass, regime briefings, and the complete research archive.</p>
            <p style="font-size: 14px; line-height: 1.7; color: #7F8C8D;">If you have any questions, reply to this email directly.</p>
            <p style="font-size: 14px; margin-top: 32px; color: #2C3E50;">Nicholas Janicki<br>Long Cycle Capital</p>
          </div>
        `,
      }),
    });

    const body = await res.json().catch(() => ({}));
    console.log('Resend response:', res.status, JSON.stringify(body));

    if (!res.ok) {
      return Response.json({ error: 'Resend error', detail: body }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('Send password error:', err);
    return Response.json({ error: 'Failed to send' }, { status: 500 });
  }
}
