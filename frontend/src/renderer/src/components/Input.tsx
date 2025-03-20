import { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

export type InputProps = ComponentProps<"input">;

export const Input = ({ className, ...props }: InputProps) => {
  return (
    <input
      className={twMerge(
        "bg-secondary border-2 border-primary rounded-xl py-2 pl-2 hover:bg-third transition-colors duration-100 focus:bg-primary/50 focus:outline-none focus:shadow-outline",
        className,
      )}
      {...props}
    />
  );
};
