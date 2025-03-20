import { ReactElement } from "react";

export function Popup({ children }): ReactElement {
  return (
    <div className="fixed h-full w-full bg-secondary/80">
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col bg-secondary border-4 border-primary rounded-3xl p-8 gap-6">
        {children}
      </div>
    </div>
  );
}
