import { useState } from "react";
import HapticSplash from "@/components/HapticSplash";
import SafeHavenChat from "@/components/SafeHavenChat";

const Index = () => {
  const [arrived, setArrived] = useState(false);

  return (
    <div className="min-h-screen safe-haven-shell">
      {arrived ? <SafeHavenChat /> : <HapticSplash onComplete={() => setArrived(true)} />}
    </div>
  );
};

export default Index;
