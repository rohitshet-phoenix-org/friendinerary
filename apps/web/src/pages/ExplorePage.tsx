import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../stores/RootStore";
import AppLayout from "../components/ui/AppLayout";
import ExplorePanel from "../components/explore/ExplorePanel";
import { Compass } from "lucide-react";

const ExplorePage = observer(() => {
  const { explore } = useStore();

  useEffect(() => {
    explore.fetchGuides();
  }, []);

  const fakeTripContext = { id: "", destinations: [] as string[], sections: [] };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
              <Compass className="w-5 h-5 text-brand-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Explore</h1>
              <p className="text-gray-500 text-sm">Discover travel guides and destination inspiration</p>
            </div>
          </div>
        </div>
        <ExplorePanel trip={fakeTripContext as never} />
      </div>
    </AppLayout>
  );
});

export default ExplorePage;
