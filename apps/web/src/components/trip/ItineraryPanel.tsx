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
  MapPin, Navigation, Route, MoreVertical
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
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

  return (
    <div className="p-4 space-y-2 max-w-3xl">
      {/* Compact toggle */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">{trip.sections.reduce((s, sec) => s + sec.placeItems.length, 0)} places total</span>
        <button onClick={() => ui.toggleCompactView()} className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
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
        className="w-full py-2 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-400 hover:border-brand-300 hover:text-brand-500 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Add section
      </button>
    </div>
  );
});

function SortableSection({ section, trip }: { section: Section; trip: Trip }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const { trips, ui } = useStore();
  const [showOptimizer, setShowOptimizer] = useState(false);
  const isExpanded = ui.expandedSections.has(section.id);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800">
      {/* Section header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750"
        onClick={() => ui.toggleSection(section.id)}
      >
        {/* Drag handle */}
        <button
          className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Color indicator */}
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: section.color }} />

        {/* Name */}
        <span className="font-medium text-sm text-gray-900 dark:text-white flex-1">
          {section.name}
          {section.date && (
            <span className="ml-2 text-xs text-gray-400 font-normal">
              {format(new Date(section.date), "EEE, MMM d")}
            </span>
          )}
        </span>

        {/* Place count */}
        <span className="text-xs text-gray-400">{section.placeItems.length} place{section.placeItems.length !== 1 ? "s" : ""}</span>

        {/* Collapse chevron */}
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </div>

      {/* Place items */}
      {isExpanded && (
        <div className="border-t border-gray-100 dark:border-gray-700">
          <PlaceItemList section={section} trip={trip} />

          {/* Route optimizer toggle */}
          {section.placeItems.length >= 2 && (
            <div className="border-t border-gray-100 dark:border-gray-700 px-3 py-2">
              <button
                onClick={() => setShowOptimizer((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-500 transition-colors"
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
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-colors border-t border-gray-100 dark:border-gray-700"
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
      <div className="px-4 py-3 text-sm text-gray-400 italic">
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
  const { trips, ui, map } = useStore();

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
        className={`flex items-start gap-2 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer group transition-colors ${
          ui.selectedPlaceItemId === item.id ? "bg-brand-50 dark:bg-brand-900/10" : ""
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

        {/* Index */}
        <span className="mt-0.5 w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 text-xs text-gray-500 flex items-center justify-center flex-shrink-0 font-medium">
          {index + 1}
        </span>

        {/* Thumbnail */}
        {item.place.photoUrls?.[0] && !ui.compactView && (
          <img src={item.place.photoUrls[0]} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.place.name}</p>
          {!ui.compactView && (
            <>
              <p className="text-xs text-gray-400 truncate mt-0.5">{item.place.address}</p>
              {item.notes && <p className="text-xs text-gray-500 mt-1 italic truncate">{item.notes}</p>}
            </>
          )}
          {item.startTime && (
            <span className="inline-flex items-center gap-1 text-xs text-brand-600 mt-0.5">
              <Clock className="w-3 h-3" /> {item.startTime}
            </span>
          )}
        </div>

        {/* Delete btn */}
        <button
          onClick={handleDelete}
          className="mt-0.5 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Travel time to next */}
      {!isLast && item.transportToNext && (
        <div className="flex items-center gap-1 pl-14 py-0.5 text-xs text-gray-400">
          <Navigation className="w-3 h-3" />
          <span>{item.transportToNext.durationMinutes} min · {item.transportToNext.distanceKm.toFixed(1)} km</span>
        </div>
      )}
    </div>
  );
}

export default ItineraryPanel;
