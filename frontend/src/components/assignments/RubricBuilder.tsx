import { useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type RubricCriterion } from "@/api/assignments.api";
import { Button } from "@/components/ui/Button";
import { GripVertical, Trash2, Plus } from "lucide-react";

interface RubricBuilderProps {
  rubric: RubricCriterion[];
  onChange: (rubric: RubricCriterion[]) => void;
}

function SortableRow({
  item,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  item: RubricCriterion;
  index: number;
  onChange: (i: number, field: keyof RubricCriterion, value: any) => void;
  onRemove: (i: number) => void;
  canRemove: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: `criterion-${index}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-2 rounded-lg border border-border bg-surface p-3"
    >
      <button
        type="button"
        className="mt-2 cursor-grab text-text-tertiary hover:text-text-secondary shrink-0"
        {...attributes}
        {...listeners}
        aria-label="Reorder criterion"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 grid grid-cols-[1fr_1fr_80px] gap-2">
        <input
          className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm outline-none focus:border-primary"
          placeholder="Criterion name"
          value={item.criterion}
          onChange={(e) => onChange(index, "criterion", e.target.value)}
        />
        <input
          className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm outline-none focus:border-primary"
          placeholder="Description"
          value={item.description}
          onChange={(e) => onChange(index, "description", e.target.value)}
        />
        <input
          type="number"
          min={1}
          className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm outline-none focus:border-primary text-center font-mono"
          placeholder="Marks"
          value={item.maxMarks}
          onChange={(e) => onChange(index, "maxMarks", parseInt(e.target.value) || 0)}
        />
      </div>
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="mt-2 text-text-tertiary hover:text-destructive transition-colors shrink-0"
          aria-label="Remove criterion"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function RubricBuilder({ rubric, onChange }: RubricBuilderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = parseInt(String(active.id).split("-")[1]);
      const newIndex = parseInt(String(over.id).split("-")[1]);
      onChange(arrayMove(rubric, oldIndex, newIndex));
    },
    [rubric, onChange]
  );

  const handleChange = useCallback(
    (i: number, field: keyof RubricCriterion, value: any) => {
      const updated = [...rubric];
      updated[i] = { ...updated[i], [field]: value };
      onChange(updated);
    },
    [rubric, onChange]
  );

  const handleRemove = useCallback(
    (i: number) => {
      onChange(rubric.filter((_, idx) => idx !== i));
    },
    [rubric, onChange]
  );

  const addRow = () => {
    onChange([...rubric, { criterion: "", description: "", maxMarks: 10 }]);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[24px_1fr_1fr_80px_24px] gap-2 px-3 text-xs text-text-tertiary font-medium">
        <span />
        <span>Criterion</span>
        <span>Description</span>
        <span className="text-center">Marks</span>
        <span />
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={rubric.map((_, i) => `criterion-${i}`)} strategy={verticalListSortingStrategy}>
          {rubric.map((item, i) => (
            <SortableRow
              key={`criterion-${i}`}
              item={item}
              index={i}
              onChange={handleChange}
              onRemove={handleRemove}
              canRemove={rubric.length > 1}
            />
          ))}
        </SortableContext>
      </DndContext>
      <Button variant="ghost" size="sm" type="button" onClick={addRow} className="mt-2">
        <Plus className="h-4 w-4" /> Add Criterion
      </Button>
    </div>
  );
}
