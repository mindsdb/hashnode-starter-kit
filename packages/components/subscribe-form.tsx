import { useRef, useState } from "react";
import { useAppContext } from "./contexts/appContext";

const SubscribeForm = () => {
  const [status, setStatus] = useState();
  const [requestInProgress, setRequestInProgress] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { publication } = useAppContext();

  const subscribe = async () => {
    const email = inputRef.current?.value;
    if (!email) return;

    setRequestInProgress(true);
    const response = await fetch("/api/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ publication: publication.id, email })
    });
    setRequestInProgress(false);

    const data = await response.json();
    setStatus(data.status);
  }
  return (
    <>
      {!status && <div className="relative w-full p-2 bg-white rounded-full dark:bg-neutral-950">
        <input
          ref={inputRef}
          type="email"
          placeholder="john@doe.com"
          className="w-full p-3 text-base text-black rounded-full outline-none dark:text-neutral-50 dark:bg-neutral-950 top-3 left-3 focus:outline-primary-600 dark:focus:outline-primary-500"
        />
        <button disabled={requestInProgress} onClick={subscribe} className="absolute px-3 py-2 text-white rounded-full bg-primary-600 dark:bg-primary-500 top-3 right-3">
          Subscribe
        </button>
      </div>}
      {status === 'PENDING' && <div className="relative w-full p-2 text-center">
        <p className="font-bold text-green-600 dark:text-green-500">
          Almost there!
        </p>
        <p className="font-medium text-slate-600 dark:text-neutral-300">
          Check your inbox for a confirmation email and click{" "}
          <strong>"Confirm and Subscribe"</strong> to complete your
          subscription. Thanks for joining us!
        </p>
      </div>}
    </>
  );
};

export default SubscribeForm;