"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Arabic } from "@/components/arabic";
import { PinPad } from "@/components/pin-pad";
import { Button, Eyebrow, Screen } from "@/components/ui";
import { createProfile } from "./actions";

type Step = "name" | "pin" | "confirm";

/* First run. Name, then a PIN, then the same PIN again. */
export function SetupScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [entry, setEntry] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [busy, setBusy] = useState(false);

  function reject(message: string) {
    setError(message);
    setShake(true);
    setTimeout(() => {
      setShake(false);
      setEntry("");
    }, 400);
  }

  async function onPinComplete(value: string) {
    if (step === "pin") {
      setPin(value);
      setEntry("");
      setError(null);
      setStep("confirm");
      return;
    }

    if (value !== pin) {
      reject("Those did not match. Start the PIN again.");
      setPin("");
      setStep("pin");
      return;
    }

    setBusy(true);
    const res = await createProfile(name, value);
    if (res.ok) {
      router.replace("/");
      router.refresh();
      return;
    }
    setBusy(false);
    reject(res.error ?? "Could not create the profile.");
    setPin("");
    setStep("pin");
  }

  if (step === "name") {
    return (
      <Screen fixed className="items-center justify-center gap-10">
        <div className="flex flex-col items-center gap-3">
          <Arabic as="p" className="text-lapis text-[56px] leading-[1.8]">
            دُرُوس
          </Arabic>
          <Eyebrow>First time</Eyebrow>
        </div>

        <form
          className="flex w-full max-w-[320px] flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim().length === 0) {
              setError("Enter a name.");
              return;
            }
            setError(null);
            setStep("pin");
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            maxLength={40}
            aria-label="Your name"
            placeholder="Your name"
            className="border-rule bg-surface-sunk text-ink placeholder:text-ink-faint focus:border-lapis rounded-[12px] border px-4 py-3.5 text-center text-[18px] outline-none"
          />
          <Button type="submit">Continue</Button>
        </form>

        <p className="text-clay h-6 text-[15px]">{error ?? ""}</p>
      </Screen>
    );
  }

  return (
    <Screen fixed className="items-center justify-center gap-10">
      <div className="flex flex-col items-center gap-3">
        <Eyebrow>{step === "pin" ? "Choose a PIN" : "Again to confirm"}</Eyebrow>
        <p className="text-ink text-[22px]">
          {step === "pin" ? `Hello, ${name.trim()}` : "One more time"}
        </p>
      </div>

      <PinPad
        value={entry}
        onChange={(next) => {
          setEntry(next);
          if (error) setError(null);
        }}
        onComplete={onPinComplete}
        disabled={busy}
        shake={shake}
      />

      <p className="text-clay h-6 text-[15px]">{error ?? ""}</p>
    </Screen>
  );
}
