import { useState } from "react";
import { observer } from "mobx-react-lite";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useStore } from "../../stores/RootStore";
import type { Trip, Section, PlaceItem } from "@friendinerary/types";
import {
  Plus, ChevronDown, ChevronRight, GripVertical, Clock, Trash2,
  MapPin, Navigation, Route,
} from "lucide-react";
import toast from "react-hot-toast";
import RouteOptimizerPanel from "./RouteOptimizerPanel";

interface ItineraryPanelProps {
  trip: Trip;
}

const ItineraryPanel = observer(({ trip }: ItineraryPanelProps) => {
  const { trips, ui } = useStore();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleSectionDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = trip.sections.findIndex((s) => s.id === active.id);
    const newIndex = trip.sections.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(trip.sections, oldIndex, newIndex);
    await trips.reorderSections(trip.id, reordered.map((s) => s.id));
  };

  const handleAddSection = async () => {
    const name = prompt("Section name:");
    if (!name) return;
    await trips.createSection(trip.id, { type: "list", name, color: "#F97316" });
  };

  const totalPlaces = trip.sections.reduce((s, sec) => s + sec.placeItems.length, 0);

  return (
    <div className="p-5 space-y-3 max-w-3xl">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-400 font-medium">{totalPlaces} place{totalPlaces !== 1 ? "s" : ""} total</span>
        <button
          onClick={() => ui.toggleCompactView()}
          className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 px-2.5 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
        >
          {ui.compactView ? "Expanded view" : "Compact view"}
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
        <SortableContext items={trip.sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          {trip.sections.map((section) => (
            <SortableSection key={section.id} section={section} trip={trip} />
          ))}
        </SortableContext>
      </DndContext>

      {/* Add section button */}
      <button
        onClick={handleAddSection}
        className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-sm text-gray-400 hover:border-brand-300 hover:text-brand-500 hover:bg-orange-50/50 dark:hover:bg-brand-900/5 transition-all flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Add section
      </button>
    </div>
  );
});

function SortableSection({ section, trip }: { section: Section; trip: Trip }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const { trips, ui, settings } = useStore();
  const [showOptimizer, setShowOptimizer] = useState(false);
  const isExpanded = ui.expandedSections.has(section.id);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Section header */}
      <div
        className="flex items-center gap-2.5 px-4 py-3 cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors"
        onClick={() => ui.toggleSection(section.id)}
      >
        {/* Drag handle */}
        <button
          className="text-gray-200 hover:text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Color indicator */}
        <div
          className="w-3.5 h-3.5 rounded-full flex-shrink-0 ring-2 ring-offset-1"
          style={{ backgroundColor: section.color, ["--tw-ring-color" as string]: section.color + "40" }}
        />

        {/* Name */}
        <span className="font-semibold text-sm text-gray-900 dark:text-white flex-1">
          {section.name}
          {section.date && (
            <span className="ml-2 text-xs text-gray-400 font-normal">
              {settings.formatShortDate(section.date)}
            </span>
          )}
        </span>

        {/* Place count badge */}
        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full font-medium">
          {section.placeItems.length}
        </span>

        {/* Collapse chevron */}
        <div className="text-gray-300">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </div>
      </div>

      {/* Place items */}
      {isExpanded && (
        <div className="border-t border-gray-100 dark:border-gray-800">
          <PlaceItemList section={section} trip={trip} />

          {/* Route optimizer toggle */}
          {section.placeItems.length >= 2 && (
            <div className="border-t border-gray-50 dark:border-gray-800 px-4 py-2.5">
              <button
                onClick={() => setShowOptimizer((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-brand-500 transition-colors font-medium"
              >
                <Route className="w-3.5 h-3.5" />
                {showOptimizer ? "Hide route optimizer" : "Optimize route"}
              </button>
              {showOptimizer && (
                <div className="mt-2">
                  <RouteOptimizerPanel section={section} tripId={trip.id} />
                </div>
              )}
            </div>
          )}

          {/* Add place button */}
          <button
            onClick={() => ui.openAddPlace(section.id)}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-brand-500 font-medium hover:bg-orange-50/50 dark:hover:bg-brand-900/10 transition-all border-t border-gray-50 dark:border-gray-800"
          >
            <Plus className="w-4 h-4" />
            Add a place
          </button>
        </div>
      )}
    </div>
  );
}

function PlaceItemList({ section, trip }: { section: Section; trip: Trip }) {
  const { trips, ui } = useStore();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = section.placeItems.findIndex((p) => p.id === active.id);
    const newIdx = section.placeItems.findIndex((p) => p.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = arrayMove(section.placeItems, oldIdx, newIdx);
    await trips.reorderPlaceItems(trip.id, section.id, reordered.map((p) => p.id));
  };

  if (section.placeItems.length === 0) {
    return (
      <div className="px-5 py-4 text-sm text-gray-400 italic flex items-center gap-2">
        <MapPin className="w-4 h-4 text-gray-300" />
        No places yet — add some!
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={section.placeItems.map((p) => p.id)} strategy={verticalListSortingStrategy}>
        {section.placeItems.map((item, idx) => (
          <SortablePlaceItem
            key={item.id}
            item={item}
            index={idx}
            sectionId={section.id}
            tripId={trip.id}
            isLast={idx === section.placeItems.length - 1}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}

function SortablePlaceItem({
  item, index, sectionId, tripId, isLast
}: {
  item: PlaceItem;
  index: number;
  sectionId: string;
  tripId: string;
  isLast: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const { trips, ui, map, settings } = useStore();

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await trips.deletePlaceItem(tripId, sectionId, item.id);
    toast.success("Place removed");
  };

  const handleClick = () => {
    ui.selectPlaceItem(item.id);
    map.panTo({ lat: item.place.coordinates.lat, lng: item.place.coordinates.lng }, 15);
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`flex items-start gap-2.5 px-4 py-3 cursor-pointer group transition-all ${
          ui.selectedPlaceItemId === item.id
            ? "bg-orange-50/70 dark:bg-brand-900/10 border-l-2 border-l-brand-500"
            : "hover:bg-gray-50/80 dark:hover:bg-gray-800/50 border-l-2 border-l-transparent"
        }`}
        onClick={handleClick}
      >
        {/* Drag handle */}
        <button
          className="mt-1 text-gray-200 hover:text-gray-400 cursor-grab flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>

        {/* Index badge */}
        <span className="mt-0.5 w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs text-gray-500 flex items-center justify-center flex-shrink-0 font-semibold">
          {index + 1}
        </span>

        {/* Thumbnail */}
        {item.place.photoUrls?.[0] && !ui.compactView && (
          <img src={item.place.photoUrls[0]} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0 shadow-sm" />
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.place.name}</p>
          {!ui.compactView && (
            <>
              <p className="text-xs text-gray-400 truncate mt-0.5">{item.place.address}</p>
              {item.notes && <p className="text-xs text-gray-500 mt-1 italic truncate">{item.notes}</p>}
            </>
          )}
          {item.startTime && (
            <span className="inline-flex items-center gap-1 text-xs text-brand-600 mt-1 bg-orange-50 dark:bg-brand-900/20 px-1.5 py-0.5 rounded-md font-medium">
              <Clock className="w-3 h-3" /> {settings.formatTime(item.startTime)}
            </span>
          )}
        </div>

        {/* Delete btn */}
        <button
          onClick={handleDelete}
          className="mt-0.5 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Travel time to next */}
      {!isLast && item.transportToNext && (
        <div className="flex items-center gap-1.5 pl-16 py-1 text-xs text-gray-400">
          <div className="w-px h-3 bg-gray-200 dark:bg-gray-700 mr-1" />
          <Navigation className="w-3 h-3 text-gray-300" />
          <span>{item.transportToNext.durationMinutes} min · {settings.formatDistance(item.transportToNext.distanceKm)}</span>
        </div>
      )}
    </div>
  );
}

export default ItineraryPanel;
