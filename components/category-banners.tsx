/* eslint-disable @next/next/no-img-element */

export function CategoryBanners() {
    const categories = [
        { name: "IPL", image: "/ipl-category.png" },
        { name: "AVIATOR", image: "/aviator-category.png" },
        { name: "MATKA", image: "/matka-category.png" },
        { name: "TEEN PATTI", image: "/teen-patti-category.png" },
    ]

    return (
        <div className="w-full px-2 py-4">
            <div className="grid grid-cols-2 gap-4">
                {categories.map((category) => (
                    <div key={category.name} className="relative w-full rounded-lg overflow-hidden">
                        <img className="w-full h-full object-contain" src={category.image || "/placeholder.svg"} alt={category.name} />
                    </div>
                ))}
            </div>
        </div>
    )
}
