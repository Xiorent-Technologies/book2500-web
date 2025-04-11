import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import Link from "next/link"

interface GameCardProps {
    title: string
    imageSrc: string
    link: string
}

export function GameCard({ title, imageSrc, link }: GameCardProps) {
    return (
        <div className="flex flex-col items-center">
            <Link href={link} className="block mb-2">
                <div className="w-40 h-40 md:w-44 md:h-44">
                    <Avatar className="w-full h-full cursor-pointer">
                        <AvatarImage src={imageSrc || "/placeholder.svg"} alt={title} />
                        <AvatarFallback>{title}</AvatarFallback>
                    </Avatar>
                </div>
            </Link>
            <h3 className="text-white font-bold text-sm md:text-lg text-center">{title}</h3>
        </div>
    )
}