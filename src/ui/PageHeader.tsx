import type { ReactNode } from "react";

interface Props {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}

/** The h1 is focusable so focus can land here after a page transition. */
export function PageHeader({ title, children, action }: Props) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1
          id="page-title"
          tabIndex={-1}
          className="text-3xl font-semibold outline-none md:text-4xl"
        >
          {title}
        </h1>
        {children && <div className="mt-1 max-w-prose text-sm text-mute">{children}</div>}
      </div>
      {action}
    </header>
  );
}
