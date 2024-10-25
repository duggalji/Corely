import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AnimatedTitle from "@/components/AnimatedTitle";
import LessonPlanForm from "@/components/LessonPlanForm";
import {
  checkLessonPlanCreationEligibility,
  hasSubscription,
} from "@/utils/stripe";
import FeatureCards from "@/components/FeatureCards";

const Page = async () => {
  const { userId } = auth();

  if (!userId) {
    redirect("/");
  }

  const isSubscribed = await hasSubscription();
  const { isEligible, message, remainingGenerations } =
    await checkLessonPlanCreationEligibility();

  return (
    <div className="bg-transparent px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
      <div className="mx-auto max-w-3xl">
        <AnimatedTitle 
          title="Create Your" 
          subtitle="Lesson Plan" 
        />
        <div className="border-white bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 drop-shadow-lg backdrop-blur-sm backdrop-filter mb-6 p-2 border border-opacity-20 rounded-xl font-extrabold text-4xl text-transparent md:text-6xl lg:text-7xl leading-tight tracking-tight animate-text-gradient hover:scale-105 transition-transform duration-300 cursor-pointer select-none">
         
        With Our Most
         
          <span className="block bg-clip-text bg-gradient-to-r from-green-300 via-blue-500 to-purple-600 mt-2 text-2xl text-transparent md:text-3xl lg:text-4xl animate-pulse">
       Advanced AI 
          </span>
        </div>
        <LessonPlanForm isSubscribed={isSubscribed.isSubscribed} />
        <FeatureCards />
        {!isEligible && (
          <div className="bg-red-100 mt-4 p-4 border border-red-400 rounded-md text-red-700">
            {message}
          </div>
        )}
        {remainingGenerations > 0 && (
          <div className="border-yellow-400 bg-yellow-100 mt-4 p-4 border rounded-md text-yellow-700">
            {message}
          </div>
        )}
        {isEligible && remainingGenerations === 0 && (
          <div className="border-green-400 bg-green-100 mt-4 p-4 border rounded-md text-green-700">
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
