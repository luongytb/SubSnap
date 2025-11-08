"use client";

import { ExternalLinkIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function PromoBox() {
  return (
    <div className="fade-in slide-in-from-bottom-4 fixed right-6 bottom-6 z-50 hidden animate-in duration-500 md:block">
      <div className="relative flex max-w-xs flex-col gap-4 overflow-hidden rounded-lg border-2 border-primary/20 bg-linear-to-br from-primary/5 via-card to-primary/5 p-4 shadow-xl ring-1 ring-primary/10">
        <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-primary/5" />
        <div className="relative flex items-center gap-2">
          <div className="relative size-5 shrink-0 overflow-hidden rounded">
            <Image
              alt="Ikiform"
              className="size-full object-contain"
              height={20}
              src="https://ikiform.com/favicon.ico"
              width={20}
            />
          </div>
          <h3 className="font-semibold text-sm">Ikiform</h3>
        </div>
        <p className="relative text-muted-foreground text-xs">
          The open-source forms platform for effortless data collection and
          analysis.
        </p>
        <Link
          className="relative flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground text-xs transition-colors hover:bg-primary/90"
          href="https://ikiform.com"
          rel="noopener noreferrer"
          target="_blank"
        >
          Learn more
          <ExternalLinkIcon aria-hidden="true" className="size-3" />
        </Link>
      </div>
    </div>
  );
}
