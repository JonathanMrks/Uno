import { twMerge } from "tailwind-merge";
import * as images from "@/assets";

export function Background({ className, children }) {
  return (
    <div
      className={twMerge("h-[100vh]", className)}
      style={{
        backgroundImage: `
            radial-gradient(circle, rgba(72, 28, 167, 0.9), rgba(26, 9, 89, 0.95)), 
            url(${images.bgFlow.default})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {children}
    </div>
  );
}
