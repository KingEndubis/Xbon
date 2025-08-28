import { useMemo } from "react"

type Commodity = "gold" | "silver" | "oil" | "diamond"

interface LogoProps {
  commodity: Commodity
  size?: "sm" | "md" | "lg"
  showText?: boolean
  className?: string
}

export function Logo({ 
  commodity, 
  size = "md", 
  showText = true, 
  className = "" 
}: LogoProps) {
  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-7 h-7", 
    lg: "w-12 h-12"
  }

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-xl sm:text-2xl",
    lg: "text-3xl sm:text-4xl"
  }

  const gradientStops = useMemo(() => {
    switch (commodity) {
      case "gold":
        return { primary: "#f59e0b", secondary: "#fde68a", accent: "#d97706" }
      case "silver":
        return { primary: "#64748b", secondary: "#e2e8f0", accent: "#475569" }
      case "oil":
        return { primary: "#059669", secondary: "#6ee7b7", accent: "#047857" }
      case "diamond":
        return { primary: "#06b6d4", secondary: "#a5f3fc", accent: "#0891b2" }
      default:
        return { primary: "#f59e0b", secondary: "#fde68a", accent: "#d97706" }
    }
  }, [commodity])

  const gradientId = `lux-gradient-${commodity}-${size}`

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg 
        width={size === "sm" ? "20" : size === "md" ? "28" : "48"} 
        height={size === "sm" ? "20" : size === "md" ? "28" : "48"} 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className="shrink-0 drop-shadow-lg"
      >
        <defs>
          <linearGradient 
            id={gradientId} 
            x1="0" y1="0" 
            x2="24" y2="24" 
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor={gradientStops.primary} />
            <stop offset="0.6" stopColor={gradientStops.secondary} />
            <stop offset="1" stopColor={gradientStops.accent} />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/> 
            </feMerge>
          </filter>
        </defs>
        <path 
          d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" 
          fill={`url(#${gradientId})`}
          filter="url(#glow)"
          className="drop-shadow-md"
        />
      </svg>
      
      {showText && (
        <div>
          <h1 className={`${textSizeClasses[size]} font-bold tracking-tight bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent`}>
            X Bon
          </h1>
          {size !== "sm" && (
            <div className={`${size === "lg" ? "text-sm" : "text-xs"} opacity-75 -mt-1 text-gray-300 font-medium tracking-wide`}>
              Luxury Commodities Exchange
            </div>
          )}
        </div>
      )}
    </div>
  )
}