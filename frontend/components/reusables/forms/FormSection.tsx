import React from "react";

export default function FormSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3 pb-2 border-b border-border/50">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-lg font-display font-semibold">{title}</h3>
      </div>
      <div>{children}</div>
    </section>
  );
}
