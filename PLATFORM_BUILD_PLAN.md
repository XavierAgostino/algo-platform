# AlgoPlatform: Master Build Plan

## 1. Project Vision
Transition from a standalone "Shortest Path Visualizer" to a **"Computer Science Algorithm Platform"**.
- **The Hub:** A high-end dashboard (Linear-style) to select tools.
- **The Tools:**
  1. Pathfinding (Dijkstra/Bellman-Ford) - *Existing*
  2. Network Design (MST: Prim's/Kruskal's) - *To Integrate*
- **Design System:** `shadcn/ui`, `21st.dev`, `Tailwind`, `Zinc/Indigo`.

## 2. Architecture Changes (Next.js App Router)
We are moving from a single route to a domain-based structure.

**Current:**
`app/page.tsx` (Contains all Logic)

**Target:**
- `app/page.tsx` → **The Hub (Dashboard)**
- `app/shortest-path/page.tsx` → **Pathfinding Tool**
- `app/mst/page.tsx` → **MST Tool**
- `components/visualizer/` → **Shared Visualizer Logic** (Renderer, Controls)

## 3. UI/UX "Wow" Components (21st.dev / MagicUI)
To make the Hub look "Industry Standard," we will use these specific components:
- **Bento Grid:** For the tool selection cards.
- **Border Beam:** For hover effects on the cards.
- **Retro Grid:** For the Hub background.

## 4. Execution Phases

### Phase 1: The Great Refactor (File Structure)
**Goal:** Move the existing logic out of root without breaking it.
1. Create folder `app/shortest-path`.
2. Move `app/page.tsx` logic into `app/shortest-path/page.tsx`.
3. Create a temporary `app/page.tsx` that just links to `/shortest-path`.
4. Verify the app still runs at the new URL.

### Phase 2: The Hub (Dashboard Design)
**Goal:** Build the "Home Page" using high-polish components.
1. **Install Dependencies:**
   - `framer-motion` (Required for Bento/Beams).
   - `clsx`, `tailwind-merge`.
2. **Add Components (21st.dev):**
   - `<BentoGrid />` (Layout)
   - `<BorderBeam />` (Card Highlight)
   - `<RetroGrid />` (Background)
3. **Build `app/page.tsx`:**
   - Hero Section: "Master Algorithms."
   - Grid:
     - **Card 1 (Pathfinding):** Link to `/shortest-path`. Icon: `Route`.
     - **Card 2 (MST):** Link to `/mst`. Icon: `Network`. Badge: "Coming Soon".

### Phase 3: The "Universal" Visualizer
**Goal:** Make the visualizer component accept an `algorithmType` prop.
1. Rename `ShortestPathVisualizer.js` to `GraphWorkspace.js`.
2. Add props: `mode` ('pathfinding' | 'mst').
3. Refactor `handleAlgorithmChange` to accept MST algorithms if mode is 'mst'.
4. Ensure `GraphRenderer.js` can handle "Tree Edges" (MST styling).

### Phase 4: MST Integration
**Goal:** Port the MST logic from the other repo.
1. Create `app/mst/page.tsx`.
2. Import `GraphWorkspace`.
3. Add `PrimsSteps.js` and `KruskalSteps.js` to the logic folder.
4. Wire them up to the generic engine.

## 5. Coding Standards (Strict)
- **Do not break the existing design.** Keep the Zinc/Indigo theme.
- **Use Lucide Icons** for everything.
- **Mobile First:** The Dashboard must stack correctly on mobile.