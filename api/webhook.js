// api/webhook.js

const SUPABASE_URL = 'https://fkcesgyzjnwuhmgnqgvh.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrY2VzZ3l6am53dWhtZ25xZ3ZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTczMjI5MywiZXhwIjoyMDU3MzA4MjkzfQ.amDCdRg3V0OUL36o4GNoYGSQoNEo1La8X9U4h7Fnvkw';
const PLAN_ID = '17fb085e-60e8-45fe-abef-4223acb62c6a'; // your plan ID

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const data = req.body;

    console.log('Received webhook data:', data);

    const email = data.customer?.email;
    const payment_reference = data.order?.id || 'unknown';

    if (!email) {
      console.error('Missing email in webhook data');
      return res.status(400).json({ message: 'Missing email in webhook data' });
    }

    // Step 1: Create the user in Supabase Auth
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY
      },
      body: JSON.stringify({
        email,
        app_metadata: { provider: 'pocketsflow' },
        email_confirm: true
      })
    });

    const userJson = await userRes.json();

    if (!userRes.ok && userJson?.msg !== 'User already registered') {
      console.error('Error creating user in Supabase Auth:', userJson);
      return res.status(500).json({ message: 'Failed to create user' });
    }

    const user_id = userJson.user?.id || userJson.id;

    if (!user_id) {
      console.error('User ID not returned after creation');
      return res.status(500).json({ message: 'No user ID returned from Supabase' });
    }

    // Step 2: Insert into user_subscriptions
    const subRes = await fetch(`${SUPABASE_URL}/rest/v1/user_subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY
      },
      body: JSON.stringify({
        email,
        user_id,
        plan_id: PLAN_ID,
        payment_reference,
        payment_provider: 'Pocketsflow'
      })
    });

    const subJson = await subRes.json();

    if (!subRes.ok) {
      console.error('Error inserting into user_subscriptions:', subJson);
      return res.status(500).json({ message: 'Failed to insert subscription' });
    }

    return res.status(200).json({
      message: 'Subscription and user created successfully',
      user_id,
      subscription: subJson
    });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
