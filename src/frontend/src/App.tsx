import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCopy,
  Loader2,
  X,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { CoordEntry } from "./backend";
import {
  useAddMultipleEntries,
  useGetAllEntries,
  useRemoveEntry,
} from "./hooks/useQueries";

const COORD_PATTERN = /\b(\d{3})\|(\d{3})\b/g;
const PAGE_SIZE = 20;

function extractCoords(text: string): string[] {
  const matches: string[] = [];
  const re = new RegExp(COORD_PATTERN.source, "g");
  let match = re.exec(text);
  while (match !== null) {
    matches.push(`${match[1]}|${match[2]}`);
    match = re.exec(text);
  }
  return matches;
}

function formatTimestamp(ns: bigint): string {
  const ms = Number(ns) / 1_000_000;
  const d = new Date(ms);
  return d.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function App() {
  const [inputText, setInputText] = useState("");
  const [username, setUsername] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [copied, setCopied] = useState(false);

  const { data: entries = [], isLoading } = useGetAllEntries();
  const addMutation = useAddMultipleEntries();
  const removeMutation = useRemoveEntry();

  const existingCoords = useMemo(
    () => new Set(entries.map((e: CoordEntry) => e.coord)),
    [entries],
  );

  const extractedCoords = useMemo(() => extractCoords(inputText), [inputText]);

  const newCoords = useMemo(
    () => [...new Set(extractedCoords.filter((c) => !existingCoords.has(c)))],
    [extractedCoords, existingCoords],
  );

  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const pagedEntries = entries.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  async function handleSubmit() {
    if (newCoords.length === 0) return;
    const now = BigInt(Date.now()) * 1_000_000n;
    const tuples: Array<[bigint, string, string]> = newCoords.map((coord) => [
      now,
      coord,
      username.trim(),
    ]);
    try {
      await addMutation.mutateAsync(tuples);
      setInputText("");
      setCurrentPage(1);
      toast.success(
        `${newCoords.length} Koordinate${
          newCoords.length !== 1 ? "n" : ""
        } hinzugefügt.`,
      );
    } catch {
      toast.error("Fehler beim Hinzufügen der Koordinaten.");
    }
  }

  async function handleDelete(id: bigint) {
    try {
      await removeMutation.mutateAsync(id);
      const newTotal = entries.length - 1;
      const newTotalPages = Math.max(1, Math.ceil(newTotal / PAGE_SIZE));
      if (currentPage > newTotalPages) setCurrentPage(newTotalPages);
    } catch {
      toast.error("Fehler beim Löschen des Eintrags.");
    }
  }

  async function handleExport() {
    const text = entries.map((e: CoordEntry) => e.coord).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Zwischenablage nicht zugänglich.");
    }
  }

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const delta = 2;
    for (
      let i = Math.max(1, currentPage - delta);
      i <= Math.min(totalPages, currentPage + delta);
      i++
    ) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className="min-h-screen bg-background font-body">
      <Toaster position="top-right" theme="dark" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent/20 text-accent">
              <Zap className="h-5 w-5" fill="currentColor" />
            </div>
            <div className="leading-tight">
              <div className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                High Voltage
              </div>
              <div className="text-sm font-bold tracking-wide text-foreground font-display">
                BABA TRACKER
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-4 sm:px-6 py-8 space-y-8">
        {/* Hero */}
        <motion.section
          className="text-center pt-4 pb-2"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-display text-5xl sm:text-6xl font-extrabold tracking-tight text-foreground mb-2">
            High Voltage
            <span className="text-accent"> Baba</span> Tracker
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Koordinaten erfassen und global teilen – alle Einträge sind
            öffentlich sichtbar.
          </p>
        </motion.section>

        {/* Input Section */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-xl border border-border bg-card shadow-panel p-6"
          aria-labelledby="section-input-title"
        >
          <h2
            id="section-input-title"
            className="text-lg sm:text-xl font-bold text-foreground font-display mb-5"
          >
            Neue Koordinaten Erfassen
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5 items-start">
            {/* Left: Textarea */}
            <div className="space-y-2">
              <Label
                htmlFor="coord-input"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
              >
                Koordinaten-Text
              </Label>
              <Textarea
                id="coord-input"
                data-ocid="coord.textarea"
                placeholder={
                  "Barbarendorf (479|469) K44\nBarbarendorf (481|479) K44"
                }
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={6}
                className="resize-y font-mono text-sm bg-input border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
              />
              {/* Helper text */}
              <p
                data-ocid="coord.helper_text"
                className="text-xs text-muted-foreground"
              >
                {inputText.trim() === "" ? (
                  "Gib Koordinaten ein – Muster: 123|456"
                ) : newCoords.length > 0 ? (
                  <span className="text-accent font-semibold">
                    {newCoords.length} neue Koordinate
                    {newCoords.length !== 1 ? "n" : ""} werden hinzugefügt
                  </span>
                ) : extractedCoords.length > 0 ? (
                  "Alle erkannten Koordinaten sind bereits gespeichert"
                ) : (
                  "Keine Koordinaten im Muster 123|456 erkannt"
                )}
              </p>
            </div>

            {/* Right: Username + Submit */}
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="username-input"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                >
                  Benutzername (optional)
                </Label>
                <Input
                  id="username-input"
                  data-ocid="coord.input"
                  placeholder="Dein Name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                />
              </div>
              <div className="flex lg:justify-end mt-auto pt-2">
                <Button
                  data-ocid="coord.submit_button"
                  onClick={handleSubmit}
                  disabled={newCoords.length === 0 || addMutation.isPending}
                  className="w-full lg:w-auto px-6 font-semibold shadow-btn"
                  style={
                    newCoords.length > 0
                      ? {
                          background:
                            "linear-gradient(135deg, oklch(0.42 0.16 142), oklch(0.55 0.18 148))",
                        }
                      : undefined
                  }
                >
                  {addMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Wird gespeichert…
                    </>
                  ) : (
                    "Hinzufügen"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Table Section */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-xl border border-border bg-card shadow-panel overflow-hidden"
          aria-labelledby="section-table-title"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-b border-border">
            <h2
              id="section-table-title"
              className="text-lg sm:text-xl font-bold text-foreground font-display"
            >
              Gespeicherte Koordinaten
              {entries.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({entries.length})
                </span>
              )}
            </h2>
            <Button
              data-ocid="coord.export_button"
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={entries.length === 0}
              className="gap-2 border-border text-muted-foreground hover:text-foreground hover:border-accent"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-accent" />
                  Kopiert!
                </>
              ) : (
                <>
                  <ClipboardCopy className="h-4 w-4" />
                  In Zwischenablage exportieren
                </>
              )}
            </Button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-ocid="coord.table">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Zeitstempel
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Koordinaten
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Benutzername
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr data-ocid="coord.loading_state">
                    <td
                      colSpan={4}
                      className="px-5 py-10 text-center text-muted-foreground"
                    >
                      <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                      Lade Einträge…
                    </td>
                  </tr>
                ) : pagedEntries.length === 0 ? (
                  <tr data-ocid="coord.empty_state">
                    <td
                      colSpan={4}
                      className="px-5 py-10 text-center text-muted-foreground text-sm"
                    >
                      Noch keine Koordinaten gespeichert.
                    </td>
                  </tr>
                ) : (
                  pagedEntries.map((entry: CoordEntry, idx: number) => (
                    <tr
                      key={String(entry.id)}
                      data-ocid={`coord.item.${idx + 1}`}
                      className="border-b border-border/50 transition-colors hover:bg-muted/20 even:bg-muted/10"
                    >
                      <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">
                        {formatTimestamp(entry.timestamp)}
                      </td>
                      <td className="px-5 py-3 font-mono text-accent font-medium">
                        {entry.coord}
                      </td>
                      <td className="px-5 py-3 text-foreground">
                        {entry.username || (
                          <span className="text-muted-foreground">–</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          data-ocid={`coord.delete_button.${idx + 1}`}
                          onClick={() => handleDelete(entry.id)}
                          disabled={removeMutation.isPending}
                          aria-label="Eintrag löschen"
                          className="inline-flex items-center justify-center h-7 w-7 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 px-6 py-4 border-t border-border">
              <button
                type="button"
                data-ocid="coord.pagination_prev"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label="Vorherige Seite"
                className="inline-flex items-center justify-center h-8 w-8 rounded text-muted-foreground hover:text-foreground hover:bg-muted/30 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {currentPage > 3 && (
                <>
                  <PaginationButton
                    page={1}
                    current={currentPage}
                    onClick={setCurrentPage}
                  />
                  {currentPage > 4 && (
                    <span className="px-1 text-muted-foreground">…</span>
                  )}
                </>
              )}

              {pageNumbers.map((p) => (
                <PaginationButton
                  key={p}
                  page={p}
                  current={currentPage}
                  onClick={setCurrentPage}
                />
              ))}

              {currentPage < totalPages - 2 && (
                <>
                  {currentPage < totalPages - 3 && (
                    <span className="px-1 text-muted-foreground">…</span>
                  )}
                  <PaginationButton
                    page={totalPages}
                    current={currentPage}
                    onClick={setCurrentPage}
                  />
                </>
              )}

              <button
                type="button"
                data-ocid="coord.pagination_next"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                aria-label="Nächste Seite"
                className="inline-flex items-center justify-center h-8 w-8 rounded text-muted-foreground hover:text-foreground hover:bg-muted/30 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </motion.section>
      </main>
    </div>
  );
}

function PaginationButton({
  page,
  current,
  onClick,
}: {
  page: number;
  current: number;
  onClick: (page: number) => void;
}) {
  const isActive = page === current;
  return (
    <button
      type="button"
      onClick={() => onClick(page)}
      aria-label={`Seite ${page}`}
      aria-current={isActive ? "page" : undefined}
      className={`inline-flex items-center justify-center h-8 w-8 rounded text-sm font-medium transition-colors ${
        isActive
          ? "bg-accent/20 text-accent border border-accent/40"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
      }`}
    >
      {page}
    </button>
  );
}
