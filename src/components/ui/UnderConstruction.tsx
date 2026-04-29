interface UnderConstructionProps {
  pageName?: string;
}

export const UnderConstruction = ({ pageName }: UnderConstructionProps) => (
    <div className="mx-auto max-w-2xl px-4 py-12 text-center">
      <h2 className="text-xl font-semibold mb-2">{pageName ?? 'Circulou'}</h2>
      <p className="text-[var(--color-mute)]">
        Esta página será habilitada em uma fase futura do MVP.
      </p>
    </div>
  );
