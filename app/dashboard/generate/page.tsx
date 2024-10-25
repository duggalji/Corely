"use client";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Upload,
  Copy,
  Twitter,
  Instagram,
  Linkedin,
  Clock,
  Zap,
} from "lucide-react";
import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import ReactMarkdown from "react-markdown";
import { Navbar } from "@/components/Navbar";
import { SignInButton, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  getUserPoints,
  saveGeneratedContent,
  updateUserPoints,
  getGeneratedContentHistory,
  createOrUpdateUser,
} from "@/utils/db/actions";
import { TwitterMock } from "@/components/social-mocks/TwitterMock";
import { InstagramMock } from "@/components/social-mocks/InstagramMock";
import { LinkedInMock } from "@/components/social-mocks/LinkedInMock";
import Link from "next/link";
import Footer from "@/components/Footer";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const contentTypes = [
  { value: "twitter", label: "Twitter Thread" },
  { value: "instagram", label: "Instagram Caption" },
  { value: "linkedin", label: "LinkedIn Post" },
];

const MAX_TWEET_LENGTH = 280;
const POINTS_PER_GENERATION = 5;

interface HistoryItem {
  id: number;
  contentType: string;
  prompt: string;
  content: string;
  createdAt: Date;
}

export default function GenerateContent() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  const [contentType, setContentType] = useState(contentTypes[0].value);
  const [prompt, setPrompt] = useState("");
  const [generatedContent, setGeneratedContent] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [userPoints, setUserPoints] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] =
    useState<HistoryItem | null>(null);

  const fetchUserPoints = useCallback(async () => {
    if (user?.id) {
      console.log("Fetching points for user:", user.id);
      const points = await getUserPoints(user.id);
      console.log("Fetched points:", points);
      setUserPoints(points);
      if (points === 0) {
        console.log("User has 0 points. Attempting to create/update user.");
        const updatedUser = await createOrUpdateUser(
          user.id,
          user.emailAddresses[0].emailAddress,
          user.fullName || ""
        );
        console.log("Updated user:", updatedUser);
        if (updatedUser) {
          setUserPoints(updatedUser.points);
        }
      }
    }
  }, [user]);

  const fetchContentHistory = useCallback(async () => {
    if (user?.id) {
      const contentHistory = await getGeneratedContentHistory(user.id);
      setHistory(contentHistory);
    }
  }, [user]);

  useEffect(() => {
    if (!apiKey) {
      console.error("Gemini API key is not set");
    }
  }, []);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
    } else if (isSignedIn && user) {
      console.log("User loaded:", user);
      fetchUserPoints();
      fetchContentHistory();
    }
  }, [isLoaded, isSignedIn, user, router, fetchUserPoints, fetchContentHistory]);

  const handleGenerate = async () => {
    if (
      !genAI ||
      !user?.id ||
      userPoints === null ||
      userPoints < POINTS_PER_GENERATION
    ) {
      alert("Not enough points or API key not set.");
      return;
    }

    setIsLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

      let promptText = `Generate ${contentType} content about "${prompt}".`;
      if (contentType === "twitter") {
        promptText +=
          " Provide a thread of 5 tweets, each under 280 characters.";
      }

      let imagePart: Part | null = null;
      if (contentType === "instagram" && image) {
        const reader = new FileReader();
        const imageData = await new Promise<string>((resolve) => {
          reader.onload = (e) => {
            if (e.target && typeof e.target.result === "string") {
              resolve(e.target.result);
            } else {
              resolve("");
            }
          };
          reader.readAsDataURL(image);
        });

        const base64Data = imageData.split(",")[1];
        if (base64Data) {
          imagePart = {
            inlineData: {
              data: base64Data,
              mimeType: image.type,
            },
          };
        }
        promptText +=
          " Describe the image and incorporate it into the caption.";
      }

      const parts: (string | Part)[] = [promptText];
      if (imagePart) parts.push(imagePart);

      const result = await model.generateContent(parts);
      const generatedText = result.response.text();

      let content: string[];
      if (contentType === "twitter") {
        content = generatedText
          .split("\n\n")
          .filter((tweet) => tweet.trim() !== "");
      } else {
        content = [generatedText];
      }

      setGeneratedContent(content);

      // Update points
      const updatedUser = await updateUserPoints(
        user.id,
        -POINTS_PER_GENERATION
      );
      if (updatedUser) {
        setUserPoints(updatedUser.points);
      }

      // Save generated content
      const savedContent = await saveGeneratedContent(
        user.id,
        content.join("\n\n"),
        prompt,
        contentType
      );

      if (savedContent) {
        setHistory((prevHistory) => [savedContent, ...prevHistory]);
      }
    } catch (error) {
      console.error("Error generating content:", error);
      setGeneratedContent(["An error occurred while generating content."]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHistoryItemClick = (item: HistoryItem) => {
    setSelectedHistoryItem(item);
    setContentType(item.contentType);
    setPrompt(item.prompt);
    setGeneratedContent(
      item.contentType === "twitter"
        ? item.content.split("\n\n")
        : [item.content]
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderContentMock = () => {
    if (generatedContent.length === 0) return null;

    switch (contentType) {
      case "twitter":
        return <TwitterMock content={generatedContent} />;
      case "instagram":
        return <InstagramMock content={generatedContent[0]} />;
      case "linkedin":
        return <LinkedInMock content={generatedContent[0]} />;
      default:
        return null;
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setImage(event.target.files[0]);
    }
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return (
      <div className="flex justify-center items-center bg-[#0a0a0a] min-h-screen">
        <div className="bg-[#111111] shadow-lg p-8 rounded-lg text-center">
          <h1 className="mb-4 font-bold text-3xl text-white">
            Welcome to ThreadCraft AI
          </h1>
          <p className="mb-6 text-gray-400">
            To start generating amazing content, please sign in or create an
            account.
          </p>
          <SignInButton mode="modal">
            <Button className="bg-blue-600 hover:bg-blue-700 px-6 py-2 text-white">
              Sign In / Sign Up
            </Button>
          </SignInButton>
          <p className="mt-4 text-gray-500 text-sm">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black min-h-screen text-white">
      <Navbar />
      <div className="mx-auto mb-8 px-4 sm:px-6 lg:px-8 py-8 container">
        <div className="gap-8 grid grid-cols-1 lg:grid-cols-3 mt-14">
          {/* Left sidebar - History */}
          <div className="lg:col-span-1 bg-gray-800 p-6 rounded-2xl h-[calc(100vh-12rem)] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-semibold text-2xl text-blue-400">History</h2>
              <Clock className="w-6 h-6 text-blue-400" />
            </div>
            <div className="space-y-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-700 hover:bg-gray-600 p-4 rounded-xl transition-colors cursor-pointer"
                  onClick={() => handleHistoryItemClick(item)}
                >
                  <div className="flex items-center mb-2">
                    {item.contentType === "twitter" && (
                      <Twitter className="mr-2 w-5 h-5 text-blue-400" />
                    )}
                    {item.contentType === "instagram" && (
                      <Instagram className="mr-2 w-5 h-5 text-pink-400" />
                    )}
                    {item.contentType === "linkedin" && (
                      <Linkedin className="mr-2 w-5 h-5 text-blue-600" />
                    )}
                    <span className="font-medium text-sm">
                      {item.contentType}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm truncate">
                    {item.prompt}
                  </p>
                  <div className="flex items-center mt-2 text-gray-400 text-xs">
                    <Clock className="mr-1 w-3 h-3" />
                    {new Date(item.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main content area */}
          <div className="space-y-6 lg:col-span-2">
            {/* Points display */}
            <div className="flex justify-between items-center bg-gray-800 p-6 rounded-2xl">
              <div className="flex items-center">
                <Zap className="mr-3 w-8 h-8 text-yellow-400" />
                <div>
                  <p className="text-gray-400 text-sm">Available Points</p>
                  <p className="font-bold text-2xl text-yellow-400">
                    {userPoints !== null ? userPoints : "Loading..."}
                  </p>
                </div>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-full text-sm text-white transition-colors">
                <Link href="/pricing">Get More Points</Link>
              </Button>
            </div>

            {/* Content generation form */}
            <div className="space-y-6 bg-gray-800 p-6 rounded-2xl">
              <div>
                <label className="block mb-2 font-medium text-gray-300 text-sm">
                  Content Type
                </label>
                <Select
                  onValueChange={setContentType}
                  defaultValue={contentType}
                >
                  <SelectTrigger className="bg-gray-700 border-none rounded-xl w-full">
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent>
                    {contentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center">
                          {type.value === "twitter" && (
                            <Twitter className="mr-2 w-4 h-4 text-blue-400" />
                          )}
                          {type.value === "instagram" && (
                            <Instagram className="mr-2 w-4 h-4 text-pink-400" />
                          )}
                          {type.value === "linkedin" && (
                            <Linkedin className="mr-2 w-4 h-4 text-blue-600" />
                          )}
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label
                  htmlFor="prompt"
                  className="block mb-2 font-medium text-gray-300 text-sm"
                >
                  Prompt
                </label>
                <Textarea
                  id="prompt"
                  placeholder="Enter your prompt here..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  className="bg-gray-700 border-none rounded-xl w-full resize-none"
                />
              </div>

              {contentType === "instagram" && (
                <div>
                  <label className="block mb-2 font-medium text-gray-300 text-sm">
                    Upload Image
                  </label>
                  <div className="flex items-center space-x-3">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="flex justify-center items-center bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-xl font-medium text-sm transition-colors cursor-pointer"
                    >
                      <Upload className="mr-2 w-5 h-5" />
                      <span>Upload Image</span>
                    </label>
                    {image && (
                      <span className="text-gray-400 text-sm">
                        {image.name}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <Button
                onClick={handleGenerate}
                disabled={
                  isLoading ||
                  !prompt ||
                  userPoints === null ||
                  userPoints < POINTS_PER_GENERATION
                }
                className="bg-blue-600 hover:bg-blue-700 py-3 rounded-xl w-full text-white transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  `Generate Content (${POINTS_PER_GENERATION} points)`
                )}
              </Button>
            </div>

            {/* Generated content display */}
            {(selectedHistoryItem || generatedContent.length > 0) && (
              <div className="space-y-4 bg-gray-800 p-6 rounded-2xl">
                <h2 className="font-semibold text-2xl text-blue-400">
                  {selectedHistoryItem ? "History Item" : "Generated Content"}
                </h2>
                {contentType === "twitter" ? (
                  <div className="space-y-4">
                    {(selectedHistoryItem
                      ? selectedHistoryItem.content.split("\n\n")
                      : generatedContent
                    ).map((tweet, index) => (
                      <div
                        key={index}
                        className="relative bg-gray-700 p-4 rounded-xl"
                      >
                        <ReactMarkdown className="mb-2 max-w-none text-sm prose-invert prose">
                          {tweet}
                        </ReactMarkdown>
                        <div className="flex justify-between items-center mt-2 text-gray-400 text-xs">
                          <span>
                            {tweet.length}/{MAX_TWEET_LENGTH}
                          </span>
                          <Button
                            onClick={() => copyToClipboard(tweet)}
                            className="bg-gray-600 hover:bg-gray-500 p-2 rounded-full text-white transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-700 p-4 rounded-xl">
                    <ReactMarkdown className="max-w-none text-sm prose-invert prose">
                      {selectedHistoryItem
                        ? selectedHistoryItem.content
                        : generatedContent[0]}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            )}

            {/* Content preview */}
            {generatedContent.length > 0 && (
              <div className="bg-gray-800 p-6 rounded-2xl">
                <h2 className="mb-4 font-semibold text-2xl text-blue-400">
                  Preview
                </h2>
                {renderContentMock()}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
