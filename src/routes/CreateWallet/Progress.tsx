export function Progress({ step, total }: { step: number; total: number }) {
  return (
    <div className="create-account__progress">
      <div className="create-account__progress--active" style={{ width: `${Math.round((step / total) * 100)}%` }}></div>
    </div>
  );
}
