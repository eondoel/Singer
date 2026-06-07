import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { parseLRC } from '../utils/parseLRC';

function getSongDuration(song) {
  const lines = parseLRC(song.lrc);
  if (!lines.length) return 0;
  return lines[lines.length - 1].time;
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatTotalDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function SortableSongItem({ song, duration, onSelect, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: song.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="song-row sortable-row">
      <span className="drag-handle" {...attributes} {...listeners}>⠿</span>
      <div className="song-row-info" onClick={() => onSelect(song)}>
        <span className="song-title">{song.title}</span>
        <span className="song-artist">{song.artist}</span>
      </div>
      <div className="song-row-actions">
        {duration > 0 && (
          <span className="song-duration">{formatDuration(duration)}</span>
        )}
        <button
          className="btn-icon"
          onClick={() => onRemove(song.id)}
          title="Remove from set list"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default function SetlistView({ setlist, songs, onBack, onReorder, onRemoveSong, onSelectSong }) {
  const setlistSongs = setlist.songIds
    .map((id) => songs.find((s) => s.id === id))
    .filter(Boolean);

  const durations = setlistSongs.map(getSongDuration);
  const totalDuration = durations.reduce((sum, d) => sum + d, 0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = setlist.songIds.indexOf(active.id);
    const newIndex = setlist.songIds.indexOf(over.id);
    onReorder(setlist.id, arrayMove(setlist.songIds, oldIndex, newIndex));
  }

  return (
    <div className="setlist-view">
      <div className="setlist-header">
        <button className="btn btn--ghost" onClick={onBack}>← Back</button>
        <div className="setlist-title-block">
          <span className="setlist-name">{setlist.name}</span>
          {setlist.event && <span className="setlist-event">{setlist.event}</span>}
          {setlist.date && (
            <span className="setlist-date">
              {new Date(setlist.date + 'T00:00:00').toLocaleDateString(undefined, {
                month: 'short', day: 'numeric', year: 'numeric',
              })}
            </span>
          )}
        </div>
        <div className="setlist-header-meta">
          <span className="setlist-count">{setlistSongs.length} songs</span>
          {totalDuration > 0 && (
            <span className="setlist-total-time">{formatTotalDuration(totalDuration)}</span>
          )}
        </div>
      </div>

      <div className="setlist-body">
        {setlistSongs.length === 0 ? (
          <p className="empty-state">
            No songs yet. Search for a song and add it to this set list.
          </p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={setlist.songIds} strategy={verticalListSortingStrategy}>
              {setlistSongs.map((song, i) => (
                <SortableSongItem
                  key={song.id}
                  song={song}
                  duration={durations[i]}
                  onSelect={onSelectSong}
                  onRemove={(id) => onRemoveSong(setlist.id, id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
