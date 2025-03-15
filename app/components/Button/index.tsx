
import React from "react";
const shapes = {
  round: "rounded-lg",
} as const;
const variants = {
  fill: {
    blue_400_19: "bg-blue-400_19 text-white-a700",
    white_A700: "bg-white-a700 shadow-xs text-blue-400",
    gray_800: "bg-gray-800 text-white-a700",
    blue_50: "bg-blue-50 text-blue-a200",
    gray_900_01: "bg-gray-900_01 text-white-a700",
  },
} as const;
const sizes = {
  lg: "h-[56px] px-[34px] text-[12px]",
  sm: "h-[40px] px-5 text-[14px]",
  xs: "h-[30px] px-4 text-[12px]",
  md: "h-[54px] px-[34px] text-[16px]",
} as const;
type ButtonProps = Omit<
  React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>,
  "onClick"
> &
  Partial<{
    className: string;
    leftIcon: React.ReactNode;
    rightIcon: React.ReactNode;
    onClick: () => void;
    shape: keyof typeof shapes;
    variant: keyof typeof variants | null;
    size: keyof typeof sizes;
    color: string;
  }>;
const Button: React.FC<React.PropsWithChildren<ButtonProps>> = ({
  children,
  className = "",
  leftIcon,
  rightIcon,
  shape,
  variant = "fill",
  size = "md",
  color = "blue_50",
  ...restProps
}) => {
  return (
    <button
      className={`${className} flex flex-row items-center justify-center text-center cursor-pointer whitespace-nowrap ${shape && shapes[shape]} ${size && sizes[size]} ${variant && variants[variant]?.[color as keyof (typeof variants)[typeof variant]]}`}
      {...restProps}
    >
      {!!leftIcon && leftIcon}
      {children}
      {!!rightIcon && rightIcon}
    </button>
  );
};
export { Button };