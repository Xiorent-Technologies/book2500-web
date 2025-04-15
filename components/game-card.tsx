import Link from "next/link"
import Image from "next/image"

interface GameCardProps {
    link: string
    title: string
    imageSrc: string
}

export function GameCard({ link, title, imageSrc }: GameCardProps) {
    return (
        <div className="flex flex-col items-center justify-center gap-3">
            <Link href={link}>
                <div className="w-[120px] h-[120px] md:w-[155px] md:h-[155px]">
                    <Image
                        src={imageSrc}
                        alt={title}
                        width={120}
                        height={120}
                        className="w-full h-full object-contain"
                    />
                </div>
            </Link>
            <h3 className="text-white font-bold text-sm md:text-lg text-center">{title}</h3>
        </div>
    )
}