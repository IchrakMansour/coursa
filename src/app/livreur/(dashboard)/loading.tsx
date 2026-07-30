// Écran de chargement instantané affiché pendant que la page va chercher ses
// données : donne un retour immédiat au clic (façon squelette).
export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-7">
        <div className="h-8 w-52 rounded-lg bg-slate-200" />
        <div className="mt-2 h-4 w-64 rounded bg-slate-100" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-4">
            <div className="h-4 w-1/3 rounded bg-slate-200" />
            <div className="mt-3 h-3 w-2/3 rounded bg-slate-100" />
            <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
