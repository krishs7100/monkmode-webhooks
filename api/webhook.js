// api/webhook.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const data = req.body;

    console.log('Received webhook data:', data);

    const email = data.customer?.email;
    const amount = data.amount;
    const payment_reference = data.order?.id || 'unknown';
    const plan_id = '17fb085e-60e8-45fe-abef-4223acb62c6a'; // Your actual plan ID

    const response = await fetch('https://fkcesgyzjnwuhmgnqgvh.supabase.co/rest/v1/user_subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrY2VzZ3l6am53dWhtZ25xZ3ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3MzIyOTMsImV4cCI6MjA1NzMwODI5M30.mDPqAzrN7kpRuFWJZfIzNGe_G-G4K1383UEuzrQ9Yc4',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrY2VzZ3l6am53dWhtZ25xZ3ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3MzIyOTMsImV4cCI6MjA1NzMwODI5M30.mDPqAzrN7kpRuFWJZfIzNGe_G-G4K1383UEuzrQ9Yc4'
      },
      body: JSON.stringify({
        email,
        plan_id,
        payment_reference,
        payment_provider: 'Pocketsflow'
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Supabase Error:', result);
      return res.status(500).json({ message: 'Failed to insert subscription' });
    }

    return res.status(200).json({ message: 'Subscription inserted successfully', data: result });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
