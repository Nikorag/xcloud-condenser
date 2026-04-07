export interface StreamingService {
  id: string;
  name: string;
  url: string;
  color: string;
  steamGridDbId?: number;
}

export const STREAMING_SERVICES: StreamingService[] = [
  {
    id: "amazon-prime-video",
    name: "Amazon Prime Video",
    url: "https://www.amazon.co.uk/gp/video/storefront",
    color: "#00A8E1",
  },
  {
    id: "netflix",
    name: "Netflix",
    url: "https://www.netflix.com/browse",
    color: "#E50914",
  },
  {
    id: "disney-plus",
    name: "Disney+",
    url: "https://www.disneyplus.com",
    color: "#113CCF",
    steamGridDbId: 5260961,
  },
  {
    id: "hbo-max",
    name: "Max",
    url: "https://play.max.com",
    color: "#002BE7",
    steamGridDbId: 5275938,
  },
  {
    id: "bbc-iplayer",
    name: "BBC iPlayer",
    url: "https://www.bbc.co.uk/iplayer",
    color: "#FF4C98",
  },
  {
    id: "itv-x",
    name: "ITVX",
    url: "https://www.itv.com",
    color: "#00C7B2",
  },
  {
    id: "channel-4",
    name: "Channel 4",
    url: "https://www.channel4.com",
    color: "#FFFFFF",
  },
  {
    id: "paramount-plus",
    name: "Paramount+",
    url: "https://www.paramountplus.com",
    color: "#0064FF",
    steamGridDbId: 5353900,
  },
  {
    id: "now-tv",
    name: "NOW",
    url: "https://www.nowtv.com",
    color: "#1CE783",
    steamGridDbId: 5328972,
  },
  {
    id: "apple-tv-plus",
    name: "Apple TV+",
    url: "https://tv.apple.com",
    color: "#000000",
  },
  {
    id: "crunchyroll",
    name: "Crunchyroll",
    url: "https://www.crunchyroll.com",
    color: "#F47521",
  },
  {
    id: "youtube",
    name: "YouTube",
    url: "https://www.youtube.com",
    color: "#FF0000",
    steamGridDbId: 36663,
  },
  {
    id: "twitch",
    name: "Twitch",
    url: "https://www.twitch.tv",
    color: "#9146FF",
  },
  {
    id: "spotify",
    name: "Spotify",
    url: "https://open.spotify.com",
    color: "#1DB954",
  },
  {
    id: "plex",
    name: "Plex",
    url: "https://app.plex.tv",
    color: "#EBAF00",
  },
];
