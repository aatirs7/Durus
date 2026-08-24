"use client";

import { useActionState } from "react";
import { Arabic } from "@/components/arabic";
import { Button, Screen } from "@/components/ui";
import { unlock, type UnlockState } from "./actions";

const INITIAL: UnlockState = { error: null };

export default function UnlockPage() {
  const [state, formAction, pending] = useActionState(unlock, INITIAL);

  return (
    <Screen className="justify-center gap-8 py-16">
      <Arabic as="p" className="text-lapis text-[56px] leading-[1.8]">
        دُرُوس
      </Arabic>

      <form action={formAction} className="flex flex-col gap-4">
        <input
          type="password"
          name="password"
          autoFocus
          autoComplete="current-password"
          aria-label="Password"
          className="border-rule bg-surface-sunk text-ink placeholder:text-ink-faint focus:border-lapis rounded-[12px] border px-4 py-3.5 text-center text-[16px] outline-none"
          placeholder="Password"
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Checking" : "Unlock"}
        </Button>
      </form>

      {state.error ? <p className="text-clay text-[16px]">{state.error}</p> : null}
    </Screen>
  );
}
