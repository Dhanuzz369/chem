import type { ComponentPropsWithoutRef, ElementType } from "react";

type ContainerProps<T extends ElementType> = {
  as?: T;
} & ComponentPropsWithoutRef<T>;

/** Page-width wrapper: 1200px max, 16px gutter on phones, wider on desktop. */
export function Container<T extends ElementType = "div">({
  as,
  className = "",
  ...props
}: ContainerProps<T>) {
  const Tag: ElementType = as ?? "div";
  return (
    <Tag
      className={`mx-auto w-full max-w-[75rem] px-4 sm:px-6 lg:px-8 ${className}`}
      {...props}
    />
  );
}
