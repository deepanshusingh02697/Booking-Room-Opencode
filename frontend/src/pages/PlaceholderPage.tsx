type PlaceholderPageProps = {
  title: string;
};

export const PlaceholderPage = ({ title }: PlaceholderPageProps) => {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-center">
      <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
      <p className="text-sm text-slate-500">
        This screen is built in a later phase. Phase 1 — Project Foundation.
      </p>
    </div>
  );
};