import Image from "next/image"

interface PromoBannerProps {
    title: string
    imageSrc: string
    logoSrc: string
}

export function PromoBanner({ title, imageSrc, logoSrc }: PromoBannerProps) {
    return (
        <div className="relative w-full h-[180px] rounded-lg overflow-hidden">
            <Image src={imageSrc || "/placeholder.svg"} alt={title} fill className="object-cover" />
            {title && (
                <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <h2 className="text-2xl font-bold">
                        <span className="text-red-600">{title.split(" ")[0]}</span>
                        {title.split(" ").length > 1 && <span className="text-yellow-400"> {title.split(" ")[1]}</span>}
                    </h2>
                </div>
            )}
            {logoSrc && (
                <div className="absolute top-4 left-4">
                    <Image src={logoSrc || "/placeholder.svg"} alt="Logo" width={80} height={30} />
                </div>
            )}
        </div>
    )
}
