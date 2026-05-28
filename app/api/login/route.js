export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json({ error: 'Email and password required' }, { status: 400 });
    }

    const validPassword = process.env.OBSERVER_PASSWORD;

    if (!validPassword) {
      console.error('OBSERVER_PASSWORD env var not set');
      return Response.json({ error: 'Auth not configured' }, { status: 500 });
    }

    if (password !== validPassword) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('Login error:', err);
    return Response.json({ error: 'Login failed' }, { status: 500 });
  }
}
