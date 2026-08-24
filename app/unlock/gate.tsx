"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Arabic } from "@/components/arabic";
import { PinPad } from "@/components/pin-pad";
import { Button, Eyebrow, Screen } from "@/components/ui";
import { MAX_NAME_LENGTH } from "@/lib/auth";
import { createAccount, findAccount, signIn } from "./actions";

/*
  One screen, two paths, decided by the name.

  Type a name. If an account has it, the pad asks for that account's
  PIN. If nothing has it, the pad asks for a new PIN twice and creates
  the account. Nothing here needs a "sign up" tab, because the name
  already says which of the two you meant.
*/

type Step = "name" | "pin" | "create" | "confirm";

export function Gate() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [firstPin, setFirstPin] = useState("");
  const [entry, setEntry] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [busy, setBusy] = useState(false);

  function reject(message: string, back: Step) {
    setError(message);
    setShake(true);
    setTimeout(() => {
      setShake(false);
      setEntry("");
      setStep(back);
      setBusy(false);
    }, 400);
  }

  function done() {
    router.replace("/today");
    router.refresh();
  }

  async function submitName() {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setError("Enter a name.");
      return;
    }

    setBusy(true);
    const { found } = await findAccount(trimmed);
    setBusy(false);
    setError(null);
    setEntry("");
    setStep(found ? "pin" : "create");
  }

  async function submitPin(value: string) {
    setBusy(true);

    if (step === "pin") {
      const res = await signIn(name, value);
      if (res.ok) return done();
      reject(res.error ?? "That did not work.", "pin");
      return;
    }

    if (step === "create") {
      setFirstPin(value);
      setEntry("");
      setError(null);
      setBusy(false);
      setStep("confirm");
      return;
    }

    if (value !== firstPin) {
      setFirstPin("");
      reject("Those did not match. Pick a PIN again.", "create");
      return;
    }

    const res = await createAccount(name, value);
    if (res.ok) return done();
    setFirstPin("");
    reject(res.error ?? "Could not create the account.", "create");
  }

  if (step === "name") {
    return (
      <Screen fixed className="items-center justify-center gap-10">
        <Arabic as="p" className="text-lapis text-[56px] leading-[1.8]">
          دُرُوس
        </Arabic>

        <form
          className="flex w-full max-w-[320px] flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submitName();
          }}
        >
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            autoFocus
            autoComplete="username"
            maxLength={MAX_NAME_LENGTH}
            aria-label="Your name"
            placeholder="Your name"
            className="border-rule bg-surface-sunk text-ink placeholder:text-ink-faint focus:border-lapis rounded-[12px] border px-4 py-3.5 text-center text-[18px] outline-none"
          />
          <Button type="submit" disabled={busy}>
            {busy ? "Checking" : "Continue"}
          </Button>
        </form>

        <p className="text-ink-faint max-w-[320px] text-[14px]">
          A new name creates an account. Everyone gets their own progress.
        </p>

        <p className="text-clay h-6 text-[15px]">{error ?? ""}</p>
      </Screen>
    );
  }

  const heading =
    step === "pin"
      ? `Welcome back, ${name.trim()}`
      : step === "create"
        ? `Hello, ${name.trim()}`
        : "One more time";

  const eyebrow =
    step === "pin"
      ? "Enter your PIN"
      : step === "create"
        ? "Choose a PIN"
        : "Again to confirm";

  return (
    <Screen fixed className="items-center justify-center gap-10">
      <div className="flex flex-col items-center gap-3">
        <Eyebrow>{eyebrow}</Eyebrow>
        <p className="text-ink text-[22px]">{heading}</p>
      </div>

      <PinPad
        value={entry}
        onChange={(next) => {
          setEntry(next);
          if (error) setError(null);
        }}
        onComplete={submitPin}
        disabled={busy}
        shake={shake}
      />

      <button
        type="button"
        onClick={() => {
          setStep("name");
          setEntry("");
          setFirstPin("");
          setError(null);
        }}
        className="text-ink-soft text-[15px]"
      >
        Not {name.trim()}?
      </button>

      <p className="text-clay h-6 text-[15px]">{error ?? ""}</p>
    </Screen>
  );
}
