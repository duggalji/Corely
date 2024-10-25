import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import prisma from "@/lib/prisma";
import Dashboard from "@/components/Dashboard";
import {
  createCheckoutLink,
  createCustomerIfNull,
  generateCustomerPortalLink,
  hasSubscription,
} from "@/utils/stripe";

const Page = async () => {
  const user = await currentUser();

  if (!user) {
    redirect("/");
  }

  try {
    const [userData, subscriptionData] = await Promise.all([
      prisma.user.upsert({
        where: { id: user.id },
        update: {},
        create: {
          id: user.id,
          email: user.emailAddresses[0].emailAddress,
          name: `${user.firstName} ${user.lastName}`,
        },
        select: {
          lessonPlans: true,
          stripe_customer_id: true,
        },
      }),
      hasSubscription(),
    ]);

    const stripeCustomerId = await createCustomerIfNull();

    const [manageLink, checkoutLink] = await Promise.all([
      generateCustomerPortalLink(stripeCustomerId),
      createCheckoutLink(stripeCustomerId),
    ]);

    return (
      <MaxWidthWrapper className="py-8 md:py-20">
        <Dashboard
          lessonPlans={userData.lessonPlans}
          subscribed={subscriptionData.isSubscribed}
          manage_link={manageLink ?? ''}
          checkout_link={checkoutLink ?? ''}
        />
      </MaxWidthWrapper>
    );
  } catch (error) {
    console.error("Error in dashboard page:", error);
    return (
      <MaxWidthWrapper className="py-8 md:py-20">
        <div>An error occurred. Please try again later.</div>
      </MaxWidthWrapper>
    );
  }
};

export default Page;
