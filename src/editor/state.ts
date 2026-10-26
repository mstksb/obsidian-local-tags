import { StateEffect, StateField } from '@codemirror/state';
import type { Transaction } from '@codemirror/state';
import { isTagCharacter, parse } from '../domain/parser.ts';
import type { Candidate, Span } from '../domain/parser.ts';

export interface Pending extends Span {
  previous: Candidate[];
}
export interface DocumentModel {
  candidates: Candidate[];
  pending: Pending[];
  committed: Candidate[];
}
export const commitTags = StateEffect.define<null>();

function overlap(a: Span, b: Span): boolean {
  return a.from < b.to && b.from < a.to;
}
function fresh(source: string): DocumentModel {
  const candidates = parse(source);
  return {
    candidates,
    pending: [],
    committed: candidates.filter((item) => item.kind === 'valid'),
  };
}

export function updateModel(previous: DocumentModel, transaction: Transaction): DocumentModel {
  const forced =
    transaction.effects.some((effect) => effect.is(commitTags)) ||
    ['input.paste', 'undo', 'redo', 'input.complete', 'input.drop'].some((event) =>
      transaction.isUserEvent(event),
    );
  if (forced) return fresh(transaction.newDoc.toString());
  const candidates = transaction.docChanged
    ? parse(transaction.newDoc.toString())
    : previous.candidates;
  const changes: { before: Span; after: Span; inserted: string }[] = [];
  transaction.changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
    changes.push({
      before: { from: fromA, to: toA },
      after: { from: fromB, to: toB },
      inserted: inserted.toString(),
    });
  });
  const map = (span: Span): Span => ({
    from: transaction.changes.mapPos(span.from, -1),
    to: transaction.changes.mapPos(span.to, 1),
  });
  const deleted = (span: Span): boolean =>
    changes.some((change) => change.before.from <= span.from && change.before.to >= span.to);
  const touched = (span: Span, change: Span): boolean =>
    change.from === change.to
      ? change.from > span.from && change.from <= span.to
      : overlap(span, change);
  const pending: Pending[] = [];
  for (const editing of previous.pending) {
    if (deleted(editing)) continue;
    const mapped = map(editing);
    if (mapped.from === mapped.to) continue;
    const candidate = candidates.find((item) => overlap(item, mapped));
    pending.push({
      ...(candidate ?? mapped),
      previous: editing.previous.map((item) => ({ ...item, ...map(item) })),
    });
  }
  if (transaction.docChanged) {
    for (const old of previous.candidates) {
      if (deleted(old) || previous.pending.some((item) => overlap(item, old))) continue;
      if (
        !changes.some((change) => {
          if (touched(old, change.before)) return true;
          const preceding = Array.from(change.inserted).at(-1) ?? '';
          return (
            change.before.from === old.from &&
            change.before.to === old.from &&
            (preceding === '#' || preceding === '\\' || isTagCharacter(preceding))
          );
        })
      )
        continue;
      const mapped = map(old);
      const candidate = candidates.find((item) => overlap(item, mapped));
      if (mapped.to > mapped.from)
        pending.push({
          ...(candidate ?? mapped),
          previous: old.kind === 'valid' ? [{ ...old, ...mapped }] : [],
        });
    }
    for (const candidate of candidates) {
      if (pending.some((item) => overlap(item, candidate))) continue;
      const changed = changes.some(
        (change) =>
          overlap(candidate, change.after) ||
          (change.after.from === change.after.to && touched(candidate, change.after)),
      );
      if (changed) pending.push({ ...candidate, previous: [] });
    }
  }
  // Joined candidates can combine multiple old occurrences. Keep every old name until commit.
  const merged: Pending[] = [];
  for (const editing of pending.sort((a, b) => a.from - b.from)) {
    const last = merged.at(-1);
    if (last && overlap(last, editing)) {
      last.to = Math.max(last.to, editing.to);
      last.previous.push(...editing.previous);
    } else merged.push({ ...editing, previous: [...editing.previous] });
  }
  const active = merged.filter((editing) =>
    transaction.state.selection.ranges.some(
      (selection) => selection.head >= editing.from && selection.head <= editing.to,
    ),
  );
  const retained = active.flatMap((editing) => editing.previous);
  const committed = candidates.filter(
    (item) => item.kind === 'valid' && !active.some((editing) => overlap(item, editing)),
  );
  return {
    candidates,
    pending: active,
    committed: [...committed, ...retained],
  };
}

export const documentField = StateField.define<DocumentModel>({
  create: (state) => fresh(state.doc.toString()),
  update: updateModel,
});

export function isEditing(model: DocumentModel, span: Span): boolean {
  return model.pending.some((item) => overlap(item, span));
}
