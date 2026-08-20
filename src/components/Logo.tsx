"use client";

import Image, { type ImageProps } from "next/image";
import logoBlack from "../../public/logo_black.svg";

type LogoProps = Omit<ImageProps, "src" | "alt">;

export default function Logo(props: LogoProps) {
  return <Image src={logoBlack} alt="DashX" priority {...props} />;
}
