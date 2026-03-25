import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../stores/RootStore";
import AppLayout from "../components/ui/AppLayout";
import ExplorePanel from "../components/explore/ExplorePanel";

const ExplorePage = observer(() => {
  const { explore } = useStore();

  useEffect(() => {
    explore.fetchGuides();
  }, []);

  // Pass a minimal trip-like object with no destination
  const fakeTripContext = { id: "", destinations: [] as string[], sections: [] };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        <ExplorePanel trip={fakeTripContext as never} />
      </div>
    </AppLayout>
  );
});

export default ExplorePage;
