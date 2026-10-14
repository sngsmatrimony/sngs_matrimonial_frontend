// Member-facing plan description, generated from the credit costs the admin
// sets per activity (MembershipPlan.costs) so it can never drift from the
// real prices. A short hook based on what the plan makes free, then one
// sentence with the actual numbers.

const credits = (n) => `${n} credit${n === 1 ? '' : 's'}`;
const isFree = (entry) => !entry || entry.unlimited || !entry.cost;

function hookFor(viewFree, chatFree, downloadFree) {
  if (viewFree && chatFree && downloadFree) return 'Everything unlimited.';
  if (viewFree && chatFree) return 'Unlimited browsing, unlimited conversations.';
  if (chatFree) return 'Talk to families freely.';
  if (viewFree) return 'Browse every profile without limits.';
  return 'Flexible credits for every step of your search.';
}

function joinClauses(clauses) {
  if (clauses.length <= 1) return clauses[0] || '';
  return `${clauses.slice(0, -1).join(', ')}, and ${clauses[clauses.length - 1]}`;
}

export function buildPlanDescription(plan) {
  const costs = plan?.costs || {};
  const view = costs.profileView;
  const chat = costs.phoneAndChat;
  const download = costs.profileDownload;
  const viewFree = isFree(view);
  const chatFree = isFree(chat);
  const downloadFree = isFree(download);

  const clauses = [
    viewFree ? 'see every profile freely' : `view any profile for just ${credits(view.cost)}`,
    chatFree ? 'chat and call families for free' : `unlock phone and chat for ${credits(chat.cost)}`,
    downloadFree ? 'download profiles at no extra cost' : `download a profile for ${credits(download.cost)}`,
  ];
  const sentence = joinClauses(clauses);

  return `${hookFor(viewFree, chatFree, downloadFree)} ${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.`;
}
