interface PageHeadingProps {
  title: string;
  description: string;
}

export default function PageHeading({
  title,
  description,
}: PageHeadingProps) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-[26px] sm:text-[32px] font-semibold text-black leading-normal">
        {title}
      </h1>
      <p className="text-sm text-[#64748b]">{description}</p>
    </div>
  );
}
