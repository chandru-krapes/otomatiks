"use client";

import { Children, cloneElement, isValidElement, useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

/**
 * Reveals its children in sequence when the group scrolls into view.
 *
 * Same contract as `components/event/Reveal.tsx`: one IntersectionObserver
 * flips one data attribute, and all the actual motion is CSS
 * (`[data-stagger]` in globals.css), so `prefers-reduced-motion` disables it
 * in one place. Each child is given an `--i` index, which CSS turns into a
 * delay — no per-child observers and no JS animation loop.
 *
 * Use for card grids, where a row arriving as a sequence reads better than a
 * block. Don't use it for long lists: past ~8 items the last card is waiting
 * noticeably, so the delay is capped below.
 */
const MAX_STEPS = 8;

export default function Stagger({
  children,
  className,
  /** Milliseconds between consecutive children. */
  step = 70,
  /** Wrapper element — `ul`/`ol` when the children are `li`. */
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  step?: number;
  as?: "div" | "ul" | "ol";
}) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const items = Children.toArray(children).map((child, index) => {
    if (!isValidElement<{ style?: CSSProperties }>(child)) return child;
    return cloneElement(child, {
      style: {
        ...child.props.style,
        // Capped so a long grid's tail doesn't lag behind the scroll.
        ["--i" as string]: Math.min(index, MAX_STEPS),
      } as CSSProperties,
    });
  });

  return (
    <Tag
      ref={ref as React.Ref<never>}
      data-stagger={visible ? "visible" : "hidden"}
      style={{ ["--stagger-step" as string]: `${step}ms` } as CSSProperties}
      className={className}
    >
      {items}
    </Tag>
  );
}
