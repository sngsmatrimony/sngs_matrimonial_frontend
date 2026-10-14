// An order the member opened but never paid stays 'pending' in the database
// forever; after an hour it's shown as "Not completed" so it doesn't read as
// a payment still in progress.
const ABANDONED_AFTER_MS = 60 * 60 * 1000;

export function displayTransactionStatus(txn) {
  if (txn?.status === 'pending' && Date.now() - new Date(txn.createdAt).getTime() > ABANDONED_AFTER_MS) {
    return 'not completed';
  }
  return txn?.status || '';
}
