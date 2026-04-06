# High Voltage Baba Tracker

## Current State
New project. No existing code beyond scaffolding.

## Requested Changes (Diff)

### Add
- Single-page coordinate sharing app in German
- Title: "High Voltage Baba Tracker"
- Multi-line text input for entering raw text containing coordinates
- Coordinate extraction via regex: pattern `(\d{3}|\d{3})` from lines like `Barbarendorf (479|469) K44`
- Optional username field stored alongside each coordinate entry
- Live helper text below input showing how many new (non-duplicate) coordinates will be added on submit
- Deduplication: only unique coordinates are persisted (by coordinate value)
- Each persisted entry: timestamp (ISO), coordinate string (e.g. `479|469`), username (optional)
- Paginated table below input: 20 rows per page, columns: Timestamp | Koordinaten | Benutzername | (delete button X)
- Delete row button per entry
- Export button: copies all coordinates to clipboard, one per line (e.g. `479|469`)
- No impressum, no data policy, no extra content beyond what is described

### Modify
Nothing (new project).

### Remove
Nothing.

## Implementation Plan
1. Backend (Motoko):
   - Data type: `CoordEntry { id: Nat; timestamp: Int; coord: Text; username: Text }`
   - Store entries in a stable `TrieMap` keyed by coord string to enforce uniqueness
   - `addCoordinates(coords: [(Text, Text)]) : async [CoordEntry]` — accepts list of (coord, username) pairs, skips duplicates, stores new ones with timestamp, returns all entries
   - `getCoordinates() : async [CoordEntry]` — returns all entries sorted by timestamp desc
   - `deleteCoordinate(id: Nat) : async Bool` — removes entry by id

2. Frontend (React/TypeScript):
   - Title header
   - Optional username input
   - Multi-line textarea for raw input
   - Live regex parsing on textarea change: extract all `\d{3}\|\d{3}` matches, compare against existing coords, show count of new ones
   - Submit button calls `addCoordinates`
   - Table with pagination (20 rows/page), showing all persisted coords
   - Delete button per row
   - Export button: joins all coords with newlines, copies to clipboard
   - All UI text in German
