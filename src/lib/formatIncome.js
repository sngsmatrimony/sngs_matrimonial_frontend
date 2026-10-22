const isAmount = (v) => typeof v === 'number' && Number.isFinite(v);

/**
 * Annual income as members read it. Income is optional, and a profile can
 * carry an income object with only the default currency (no amounts) — that
 * must read "Not disclosed", never "INR undefined-undefined".
 */
export function formatIncome(income, emptyText = 'Not disclosed') {
  if (!income) return emptyText;
  const text = typeof income.displayText === 'string' ? income.displayText.trim() : '';
  if (text && !/undefined|null|NaN/.test(text)) return text;
  const { min, max } = income;
  if (!isAmount(min) && !isAmount(max)) return emptyText;
  const fmt = (v) => v.toLocaleString('en-IN');
  const range = isAmount(min) && isAmount(max) && min !== max ? `${fmt(min)} - ${fmt(max)}` : fmt(isAmount(min) ? min : max);
  const currency = income.currency && income.currency !== 'Others' ? `${income.currency} ` : '';
  return `${currency}${range}`;
}
