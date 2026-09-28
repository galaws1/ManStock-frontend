export function ErreurGlobale({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="mb-4 rounded border-l-4 border-alerte bg-alerte-pale px-3 py-2 text-sm">
      {message}
    </p>
  );
}
