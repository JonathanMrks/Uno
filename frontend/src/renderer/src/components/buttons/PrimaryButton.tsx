import { twMerge } from "tailwind-merge";
import { ActionButton, ActionButtonProps } from "@/components";

export function PrimaryButton({
  className,
  children,
  ...props
}: ActionButtonProps) {
  return (
    <ActionButton
      className={twMerge("bg-primary border-primary border-4", className)}
      {...props}
    >
      {children}
    </ActionButton>
  );
}
