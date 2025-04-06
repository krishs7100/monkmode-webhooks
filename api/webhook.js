export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const data = req.body;

  // You can add validation here with a secret if needed

  console.log("Received webhook data:", data);

  // Handle your logic here, for example:
  // - Mark user as premium in your Supabase DB
  // - Send confirmation email, etc.

  return res.status(200).json({ message: 'Webhook received!' });
}
