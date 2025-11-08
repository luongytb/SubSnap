import * as React from "react";

import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  function Card({ className, ...props }, ref) {
    return (
      <div
        className={cn(
          "rounded-lg border bg-card p-4 text-card-foreground shadow-sm",
          className
        )}
        data-slot="card"
        ref={ref}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(function CardHeader({ className, ...props }, ref) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 p-0", className)}
      data-slot="card-header"
      ref={ref}
      {...props}
    />
  );
});
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentProps<"h3">
>(function CardTitle({ className, ...props }, ref) {
  return (
    <h3
      className={cn("font-semibold leading-none tracking-tight", className)}
      data-slot="card-title"
      ref={ref}
      {...props}
    />
  );
});
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentProps<"p">
>(function CardDescription({ className, ...props }, ref) {
  return (
    <p
      className={cn("text-muted-foreground text-sm", className)}
      data-slot="card-description"
      ref={ref}
      {...props}
    />
  );
});
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(function CardContent({ className, ...props }, ref) {
  return (
    <div
      className={cn("p-0", className)}
      data-slot="card-content"
      ref={ref}
      {...props}
    />
  );
});
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(function CardFooter({ className, ...props }, ref) {
  return (
    <div
      className={cn("flex items-center p-0", className)}
      data-slot="card-footer"
      ref={ref}
      {...props}
    />
  );
});
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
