
import React from "react";
const sizes = {
  textxs: "text-[10px] font-normal",
  texts: "text-[12px] font-normal",
  textlg: "text-[16px] font-normal",
};
export type TextProps = Partial<{
  className: string;
  as: any;
  size: keyof typeof sizes;
}> &
  React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>;
const Text: React.FC<React.PropsWithChildren<TextProps>> = ({
  children,
  className = "",
  as,
  size = "textxs",
  ...restProps
}) => {
  const Component = as || "p";
  return (
    <Component
      className={`text-black-900 font-sourcecodepro ${className} ${sizes[size as keyof typeof sizes]} `}
      {...restProps}
    >
      {children}
    </Component>
  );
};
export { Text };
