import { useEffect, useState } from "react";

export default function useSaveStatus(trigger) {
  const [status, setStatus] = useState("saved");

  useEffect(() => {
    setStatus("saving");

    const timeout = setTimeout(() => {
      setStatus("saved");
    }, 600);

    return () => clearTimeout(timeout);
  }, [trigger]);

  return status;
}