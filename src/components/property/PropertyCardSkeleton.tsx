export default function PropertyCardSkeleton({ count = 4 }: { count?: number }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 animate-pulse"
                >
                    {/* Image skeleton */}
                    <div className="aspect-[4/3] bg-gray-200" />

                    {/* Content skeleton */}
                    <div className="p-5 space-y-4">
                        {/* Title */}
                        <div className="h-5 bg-gray-200 rounded-lg w-3/4" />

                        {/* Location */}
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gray-200 rounded-full" />
                            <div className="h-4 bg-gray-200 rounded-lg w-1/2" />
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="h-4 bg-gray-200 rounded-lg" />
                            <div className="h-4 bg-gray-200 rounded-lg" />
                            <div className="h-4 bg-gray-200 rounded-lg" />
                            <div className="h-4 bg-gray-200 rounded-lg" />
                        </div>

                        {/* Price */}
                        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                            <div>
                                <div className="h-3 bg-gray-200 rounded w-12 mb-1" />
                                <div className="h-6 bg-gray-200 rounded-lg w-32" />
                            </div>
                            <div className="w-8 h-8 bg-gray-200 rounded-full" />
                        </div>
                    </div>
                </div>
            ))}
        </>
    )
}
