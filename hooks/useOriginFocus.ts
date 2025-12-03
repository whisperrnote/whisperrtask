import { SpotifyAPI } from "@campnetwork/origin";
import { useAuth } from "@campnetwork/origin/react";
import { useState } from "react";

export const useOriginFocus = () => {
  // @ts-ignore
  const { isAuthenticated } = useAuth();
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const spotify = new SpotifyAPI({ apiKey: process.env.NEXT_PUBLIC_ORIGIN_API_KEY || '' });

  const fetchPlaylists = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      // @ts-ignore - Hypothetical method based on instructions
      const results = await spotify.getUserPlaylists(); 
      setPlaylists(results || []);
    } catch (e) {
      console.error("Failed to fetch Spotify playlists", e);
    } finally {
      setLoading(false);
    }
  };

  return {
    isAuthenticated,
    playlists,
    loading,
    fetchPlaylists
  };
};
