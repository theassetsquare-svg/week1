import Link from "next/link";
import type { Venue } from "@/lib/types";

export default function VenueCard({ venue }: { venue: Venue }) {
  return (
    <Link
      href={"/club/" + venue.slug + "/"}
      className="group block bg-white dark:bg-[#1a1a2e] rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg hover:border-violet-300 dark:hover:border-violet-600 transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-bold text-lg group-hover:text-violet-600 transition-colors">
          {venue.nameKo}
        </h3>
        {venue.beginnerFriendly && (
          <span className="shrink-0 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
            초보추천
          </span>
        )}
      </div>
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
    </Link>
  );
}
