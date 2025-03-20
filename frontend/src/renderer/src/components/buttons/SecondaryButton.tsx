import { twMerge } from "tailwind-merge";
import { ActionButton, ActionButtonProps } from "@/components";

export function SecondaryButton({
  className,
  children,
  ...props
}: ActionButtonProps) {
  return (
    <ActionButton
      className={twMerge(
        "bg-secondary bg-opacity-30 border-4 border-primary",
        className,
      )}
      {...props}
    >
      {children}
    </ActionButton>
  );
}
