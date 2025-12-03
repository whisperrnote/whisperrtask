// hooks/useOriginEnricher.ts
import { TwitterAPI } from "@campnetwork/origin";

export const useOriginEnricher = () => {
    // Initialize APIs with API Key from Env
    const twitter = new TwitterAPI({ apiKey: process.env.NEXT_PUBLIC_ORIGIN_API_KEY || '' }); 
    
    const enrichGuest = async (handle: string) => {
        try {
            // @ts-ignore
            return await twitter.fetchUserByUsername(handle);
        } catch (e) {
            console.warn("Origin SDK: Could not fetch user", e);
            return null;
        }
    };

    return { enrichGuest };
};
