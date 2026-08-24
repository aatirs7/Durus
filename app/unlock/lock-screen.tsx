"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Arabic } from "@/components/arabic";
import { PinPad } from "@/components/pin-pad";
import { Screen } from "@/components/ui";
import { signIn } from "./actions";

export function LockScreen({ name }: { name: string }) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(value: string) {
    setBusy(true);
    const res = await signIn(value);

    if (res.ok) {
      router.replace("/");
      router.refresh();
      return;
    }

    setError(res.error);
    setShake(true);
    setTimeout(() => {
      setShake(false);
      setPin("");
      setBusy(false);
    }, 400);
  }

  return (
    <Screen fixed className="items-center justify-center gap-10">
      <div className="flex flex-col items-center gap-3">
        <Arabic as="p" className="text-lapis text-[40px] leading-[1.8]">
          دُرُوس
        </Arabic>
        <p className="text-ink text-[22px]">Welcome back, {name}</p>
      </div>

      <PinPad
        value={pin}
        onChange={(next) => {
          setPin(next);
          if (error) setError(null);
        }}
        onComplete={submit}
        disabled={busy}
        shake={shake}
      />

      <p className="text-clay h-6 text-[15px]">{error ?? ""}</p>
    </Screen>
  );
}
