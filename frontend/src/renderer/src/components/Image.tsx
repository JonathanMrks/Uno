import React, { ComponentProps } from "react";

interface ImageProps extends ComponentProps<"img"> {
  src: string;
  alt: string;
}

export const Image: React.FC<ImageProps> = ({
  src,
  alt,
  className,
  ...props
}) => {
  return <img src={src} alt={alt} className={className} {...props} />;
};
