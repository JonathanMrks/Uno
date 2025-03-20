import { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

export type ActionButtonProps = ComponentProps<"button">;

export const ActionButton = ({
  className,
  children,
  type,
  ...props
}: ActionButtonProps) => {
  return (
    <button
      className={twMerge(
        "py-3 rounded-xl text-white hover:bg-third active:bg-third/65 transition-colors duration-100 focus:outline-none focus:shadow-outline",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
};
