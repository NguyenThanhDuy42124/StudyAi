import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface Star {
  id: number
  x: number
  y: number
  delay: number
  duration: number
}

export function ShootingStars() {
  const [stars, setStars] = useState<Star[]>([])

  useEffect(() => {
    const generateStar = () => {
      // Spawn either above the top edge OR to the left of the left edge
      const isTopEdge = Math.random() > 0.5;
      
      const newStar: Star = {
        id: Date.now() + Math.random(),
        x: isTopEdge ? Math.random() * 120 - 20 : -10 - Math.random() * 20, 
        y: isTopEdge ? -10 - Math.random() * 20 : Math.random() * 120 - 20,
        delay: Math.random() * 0.5,
        duration: Math.random() * 6 + 6, // 6-12 seconds // 2-3.5 seconds
      }
      setStars((prev) => [...prev.slice(-30), newStar])
    }

    const interval = setInterval(generateStar, 250)
    // Initial burst
    for(let i=0; i<10; i++) generateStar();

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {stars.map((star) => (
        <span
          key={star.id}
          className={cn(
            "animate-meteor absolute h-[1px] w-[100px] sm:w-[150px] rounded-full",
            "shadow-[0_0_0_1px_#ffffff10]",
            "bg-gradient-to-r from-primary/80 to-transparent"
          )}
          style={{
            top: `${star.y}%`,
            left: `${star.x}%`,
            animationDuration: `${star.duration}s`,
            animationDelay: `${star.delay}s`,
          }}
        >
          {/* Meteor head */}
          <div className="absolute top-1/2 left-0 h-[2px] w-[2px] -translate-y-1/2 rounded-full bg-primary shadow-[0_0_6px_1px_var(--color-primary)]" />
        </span>
      ))}
    </div>
  )
}
