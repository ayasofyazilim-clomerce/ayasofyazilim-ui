# ConfirmProvider

`ConfirmProvider` and `useConfirm` from `@repo/ayasofyazilim-ui/custom/confirm-provider` give any client component a promise-based confirmation dialog built on `components/alert-dialog`.

## When to use

- Before a destructive or irreversible action (delete, revoke, discard) where you want `if (await confirm(...))` instead of wiring dialog state by hand.
- Several places in one app need the same confirmation look, with shared button labels.
- Not for forms or dialogs with their own content: use `Dialog` for those.

## Minimal example

```tsx
import {
  ConfirmProvider,
  useConfirm,
} from "@repo/ayasofyazilim-ui/custom/confirm-provider";

function DeleteButton({ onDelete }: { onDelete: () => void }) {
  const confirm = useConfirm();
  return (
    <button
      onClick={async () => {
        const ok = await confirm({
          title: "Delete document?",
          description: "This cannot be undone.",
          confirmLabel: "Delete",
          variant: "destructive",
        });
        if (ok) onDelete();
      }}
    >
      Delete
    </button>
  );
}

export function App() {
  return (
    <ConfirmProvider labels={{ confirm: "Yes", cancel: "No" }}>
      <DeleteButton onDelete={() => {}} />
    </ConfirmProvider>
  );
}
```

## Props

`ConfirmProvider`

| Prop       | Type                                    | Default                      | Notes                              |
| ---------- | --------------------------------------- | ---------------------------- | ---------------------------------- |
| `children` | `ReactNode`                             | required                     |                                    |
| `labels`   | `{ confirm?: string; cancel?: string }` | `"Confirm"` / `"Cancel"`     | Provider-wide button text.         |

`useConfirm()` returns `(options: ConfirmOptions) => Promise<boolean>`.

`ConfirmOptions`

| Option         | Type                          | Default     | Notes                                        |
| -------------- | ----------------------------- | ----------- | -------------------------------------------- |
| `title`        | `ReactNode`                   | required    |                                              |
| `description`  | `ReactNode`                   | none        |                                              |
| `confirmLabel` | `string`                      | provider    | Per-call label wins over provider labels.    |
| `cancelLabel`  | `string`                      | provider    | Per-call label wins over provider labels.    |
| `variant`      | `"default" \| "destructive"`  | `"default"` | `destructive` styles the confirm button.     |

Behaviour: confirm resolves `true`; Cancel and Escape resolve `false`; clicking outside does nothing (the dialog stays open, as with Radix AlertDialog). Focus starts on Cancel. Calling `confirm()` while a dialog is open resolves the open one with `false` and shows the new one. Unmounting the provider while open resolves with `false`.

## Common mistakes

- Calling `useConfirm()` outside `<ConfirmProvider>`: it throws `useConfirm must be used inside <ConfirmProvider>`.
- Treating the promise as "confirmed or rejected": it never rejects; always check the boolean.
- Awaiting `confirm()` inside `startTransition(async ...)`: the dialog's result arrives outside the transition. Confirm first, then start the transition.
- Using it in a server component: it is client-only (`"use client"`).
