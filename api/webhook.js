// api/webhook.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const SUPABASE_URL = 'https://fkcesgyzjnwuhmgnqgvh.supabase.co';
  const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrY2VzZ3l6am53dWhtZ25xZ3ZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTczMjI5MywiZXhwIjoyMDU3MzA4MjkzfQ.amDCdRg3V0OUL36o4GNoYGSQoNEo1La8X9U4h7Fnvkw';
  const plan_id = '17fb085e-60e8-45fe-abef-4223acb62c6a'; // Your premium plan ID

  try {
    const data = req.body;
    console.log('Received webhook data:', data);

    const email = data.customer?.email;
    const payment_reference = data.order?.id || 'unknown';

    if (!email) {
      return res.status(400).json({ message: 'Missing email in webhook data' });
    }

    // 1. Create user in Supabase Auth using Admin API
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        email,
        app_metadata: { provider: 'pocketsflow' },
        email_confirm: true
      })
    });

    const user = await userRes.json();

    if (!userRes.ok) {
      console.error('Error creating user in Supabase Auth:', user);
      return res.status(500).json({ message: 'Failed to create user in Supabase Auth', error: user });
    }

    const user_id = user.id;

    // 2. Insert subscription record
    const subRes = await fetch(`${SUPABASE_URL}/rest/v1/user_subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        user_id,
        email,
        plan_id,
        payment_reference,
        payment_provider: 'Pocketsflow'
      })
    });

    const result = await subRes.json();

    if (!subRes.ok) {
      console.error('Supabase DB insert error:', result);
      return res.status(500).json({ message: 'Failed to insert subscription', error: result });
    }

    return res.status(200).json({ message: 'User and subscription inserted successfully', user_id, data: result });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return res.status(500).json({ message: 'Internal Server Error', error });
  }
}
