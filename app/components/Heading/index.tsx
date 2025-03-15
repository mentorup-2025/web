
import React from "react";
const sizes = {
  textmd: "text-[14px] font-medium",
  textxl: "text-[18px] font-medium",
  text2xl: "text-[20px] font-medium",
  text3xl: "text-[25px] font-medium md:text-[23px] sm:text-[21px]",
  headingxs: "text-[12px] font-bold",
  headings: "text-[30px] font-semibold md:text-[28px] sm:text-[26px]",
};
export type HeadingProps = Partial<{
  className: string;
  as: any;
  size: keyof typeof sizes;
}> &
  React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>;
const Heading: React.FC<React.PropsWithChildren<HeadingProps>> = ({
  children,
  className = "",
  size = "textxl",
  as,
  ...restProps
}) => {
  const Component = as || "h6";
  return (
    <Component
      className={`text-black-900 font-averiagruesalibre ${className} ${sizes[size] as keyof typeof sizes}`}
      {...restProps}
    >
      {children}
    </Component>
  );
};
export { Heading };
