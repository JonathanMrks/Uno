import { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

export const Logo = ({ className }: ComponentProps<"label">) => {
  return <label className={twMerge("text-7xl", className)}>JUno</label>;
};
