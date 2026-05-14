import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder'
const stripe = new Stripe(stripeKey, {
  apiVersion: '2024-12-18.acacia' as any,
})

export async function POST(req: Request) {
  try {
    const { priceId, userId, userEmail } = await req.json()
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lapidado.vercel.app'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${baseUrl}/admin?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/admin`,
      customer_email: userEmail,
      client_reference_id: userId,
      metadata: {
        userId: userId,
      },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (err: any) {
    console.error('Stripe Checkout Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
