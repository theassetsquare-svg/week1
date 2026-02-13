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
  "/images/hero-1.jpg",
  "/images/hero-2.jpg",
  "/images/vip-1.jpg",
  "/images/lounge-1.jpg",
  "/images/gallery-2.jpg",
  "/images/gallery-3.jpg",
  "/images/gallery-4.jpg",
  "/images/gallery-5.jpg",
];

function getCardImage(slug: string, index?: number): string {
  if (index !== undefined) return CARD_IMAGES[index % CARD_IMAGES.length];
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) - hash + slug.charCodeAt(i)) | 0;
  }
  return CARD_IMAGES[Math.abs(hash) % CARD_IMAGES.length];
}

export default function VenueCard({
  venue,
  index,
}: {
  venue: Venue;
  index?: number;
}) {
  return (
    <Link
      href={"/club/" + venue.slug + "/"}
      className="group card-premium rounded-2xl overflow-hidden animate-fade-up"
      style={index !== undefined ? { animationDelay: `${(index % 6) * 0.08}s` } : undefined}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={getCardImage(venue.slug, index)}
          alt={`${venue.city} ${venue.nameKo} 나이트클럽`}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d15] via-transparent to-transparent" />
        {venue.beginnerFriendly && (
          <span className="absolute top-3 right-3 bg-green-500/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wider backdrop-blur-sm">
            초보추천
          </span>
        )}
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-purple-300 text-[10px] font-medium tracking-wider uppercase mb-0.5">
            {venue.city} · {venue.region}
          </p>
          <h3 className="text-white text-lg font-bold group-hover:text-purple-200 transition-colors">
            {venue.nameKo}
          </h3>
        </div>
      </div>
      <div className="p-4">
        <p className="text-gray-500 text-sm line-clamp-2 mb-3">{venue.summary.replace(/7080\s*(음악\s*(부터|과|,)\s*)?/g, "").trim()}</p>
        <div className="flex flex-wrap gap-1.5">
          {venue.themes
            .filter((t) => t !== "7080" && t !== "소셜댄스")
            .slice(0, 3)
            .map((t) => (
              <span
                key={t}
                className="text-[10px] border border-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full"
              >
                {t}
              </span>
            ))}
          {venue.parking && (
            <span className="text-[10px] border border-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full">
              주차가능
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
