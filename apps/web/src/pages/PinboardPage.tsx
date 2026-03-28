import { observer } from "mobx-react-lite";
import AppLayout from "../components/ui/AppLayout";
import { Map, Globe } from "lucide-react";

const PinboardPage = observer(() => {
  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
            <Map className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Pinboard</h1>
            <p className="text-gray-500 text-sm">Track every country and city you've explored</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-12 text-center">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center mx-auto mb-6">
            <Globe className="w-12 h-12 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">World map coming soon</h2>
          <p className="text-gray-400 max-w-sm mx-auto">
            Pin the countries and cities you've visited, track your travel stats, and see how much of the world you've explored.
          </p>
        </div>
      </div>
    </AppLayout>
  );
});

export default PinboardPage;
