import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export async function POST(req: Request) {
  try {
    const { priceId, userId } = await req.json();
    
    if (!priceId || typeof priceId !== 'string') {
      return NextResponse.json(
        { error: "Invalid or missing priceId" },
        { status: 400 }
      );
    }
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: "Invalid or missing userId" },
        { status: 400 }
      );
    }

    console.log(`Attempting to create checkout session with priceId: ${priceId} for userId: ${userId}`);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/generate?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      client_reference_id: userId,
    });

    console.log(`Checkout session created successfully with ID: ${session.id}`);
    return NextResponse.json({ sessionId: session.id });
  } catch (error: unknown) {
    console.error("Error creating checkout session:", error);
    
    if (error instanceof Stripe.errors.StripeInvalidRequestError) {
      return NextResponse.json(
        { error: "Invalid request to Stripe API", details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error creating checkout session", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}