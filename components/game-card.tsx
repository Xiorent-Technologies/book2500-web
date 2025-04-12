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
            <Link href={link} className="block">
                <div className="w-48 h-48 md:w-48 md:h-48">
                    <Avatar className="w-full h-full cursor-pointer">
                        <AvatarImage src={imageSrc || "/placeholder.svg"} alt={title} />
                        <AvatarFallback>{title}</AvatarFallback>
                    </Avatar>
                </div>
            </Link>
            <h3 className="text-white font-bold text-sm md:text-lg text-center -mt-1">{title}</h3>
        </div>
    )
}