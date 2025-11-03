import blurFigure from "@/assets/blur-figure.png";
import abstractRose from "@/assets/abstract-rose.png";

interface DecorativeImageProps {
  variant?: "figure" | "rose";
  className?: string;
}

const DecorativeImage = ({ variant = "figure", className = "" }: DecorativeImageProps) => {
  const src = variant === "figure" ? blurFigure : abstractRose;
  
  return (
    <div className={`absolute pointer-events-none ${className}`}>
      <img 
        src={src} 
        alt="" 
        className="opacity-20 mix-blend-soft-light"
      />
    </div>
  );
};

export default DecorativeImage;
