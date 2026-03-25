import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { api } from "../lib/api";
import AppLayout from "../components/ui/AppLayout";
import { Map } from "lucide-react";

const PinboardPage = observer(() => {
  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Map className="w-6 h-6 text-brand-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Pinboard</h1>
        </div>
        <div className="card p-8 text-center text-gray-400">
          <Map className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">World map coming soon</p>
          <p className="text-sm mt-1">Pin the countries and cities you've visited</p>
        </div>
      </div>
    </AppLayout>
  );
});

export default PinboardPage;
