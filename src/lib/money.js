// ₹ amounts as members see them: whole rupees without decimals, otherwise
// always two decimals (₹101.40, not ₹101.4).
export function formatRupees(amount) {
  const n = Number(amount) || 0;
  const whole = Number.isInteger(n);
  return `₹${n.toLocaleString('en-IN', {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
