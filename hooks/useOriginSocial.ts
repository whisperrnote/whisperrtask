import { TwitterAPI } from "@campnetwork/origin";
import { useAuth } from "@campnetwork/origin/react";
import { useState } from "react";

export const useOriginSocial = () => {
  // @ts-ignore
  const { isAuthenticated } = useAuth();
  const [socialContext, setSocialContext] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const twitter = new TwitterAPI({ apiKey: process.env.NEXT_PUBLIC_ORIGIN_API_KEY || '' });

  const fetchSocialContext = async (handle: string) => {
    if (!isAuthenticated || !handle) return;
    setLoading(true);
    try {
      // @ts-ignore
      const user = await twitter.fetchUserByUsername(handle);
      // @ts-ignore
      const tweets = await twitter.fetchTweetsByUsername(handle, { limit: 3 });
      setSocialContext({ user, tweets });
    } catch (e) {
      console.error("Failed to fetch social context", e);
    } finally {
      setLoading(false);
    }
  };

  return {
    isAuthenticated,
    socialContext,
    loading,
    fetchSocialContext
  };
};
