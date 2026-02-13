import Link from "next/link";
import type { Venue } from "@/lib/types";

const CARD_IMAGES = [
  "/images/party-1.jpg",
  "/images/dj-booth.jpg",
  "/images/party-confetti.jpg",
  "/images/party-lights.jpg",
  "/images/dance-floor.jpg",
  "/images/concert-crowd.jpg",
  "/images/club-interior.jpg",
  "/images/neon-party.jpg",
];

function getCardImage(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) - hash + slug.charCodeAt(i)) | 0;
  }
  return CARD_IMAGES[Math.abs(hash) % CARD_IMAGES.length];
}

export default function VenueCard({ venue }: { venue: Venue }) {
  return (
    <Link
      href={"/club/" + venue.slug + "/"}
      className="group block bg-white dark:bg-[#1a1a2e] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:border-violet-300 dark:hover:border-violet-600 transition-all duration-200"
    >
      <div className="relative h-40 overflow-hidden">
        <img
          src={getCardImage(venue.slug)}
          alt={`${venue.nameKo} 나이트클럽`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="font-bold text-lg text-white drop-shadow-lg group-hover:text-violet-200 transition-colors">
            {venue.nameKo}
          </h3>
        </div>
        {venue.beginnerFriendly && (
          <span className="absolute top-3 right-3 text-xs bg-green-500/90 text-white px-2 py-0.5 rounded-full font-medium">
            초보추천
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="text-sm text-gray-500 mb-2">{venue.address}</p>
        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-3">
          {venue.summary}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {venue.themes.map((t) => (
            <span
              key={t}
              className="text-xs bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 px-2 py-0.5 rounded-full"
            >
              {t}
            </span>
          ))}
          {venue.priceMin && (
            <span className="text-xs bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-0.5 rounded-full">
              ₩{(venue.priceMin / 10000).toFixed(0)}만~
              {venue.priceMax ? (venue.priceMax / 10000).toFixed(0) + "만" : ""}
            </span>
          )}
          {venue.parking && (
            <span className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-full">
              주차가능
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
