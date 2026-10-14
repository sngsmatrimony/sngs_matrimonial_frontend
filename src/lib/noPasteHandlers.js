/**
 * Spread onto a password `<Input>` to block copy/cut/paste — reduces the
 * chance of a password being silently shared via clipboard managers, synced
 * notes, etc. Not a security boundary on its own, just a reasonable default
 * for a field this sensitive.
 */
export const noPasteHandlers = {
  onCopy: (e) => e.preventDefault(),
  onCut: (e) => e.preventDefault(),
  onPaste: (e) => e.preventDefault(),
};
