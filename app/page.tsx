"use client";

import { useState, useEffect, useCallback } from "react";
import { db, newSessionId, eventDateOf, type Note } from "@/lib/db";
import NoteInput, { type SessionLine } from "@/components/NoteInput";
import NoteList from "@/components/NoteList";
import TotalBar from "@/components/TotalBar";
import Filters, { type DateRange } from "@/components/Filters";
import ExportButton from "@/components/ExportButton";
import ThemeToggle from "@/components/ThemeToggle";
import InstallPrompt from "@/components/InstallPrompt";
import ErrorBoundary from "@/components/ErrorBoundary";
import Toast from "@/components/Toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Calculator, Search } from "lucide-react";

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>({ from: "", to: "" });
  const [loaded, setLoaded] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Note[] | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    undo?: () => void;
  } | null>(null);
  const [clearAllOpen, setClearAllOpen] = useState(false);

  const loadNotes = useCallback(() => {
    return db.notes
      .orderBy("createdAt")
      .reverse()
      .toArray()
      .then(setNotes);
  }, []);

  useEffect(() => {
    let cancelled = false;
    db.notes
      .orderBy("createdAt")
      .reverse()
      .toArray()
      .then((all) => {
        if (!cancelled) {
          setNotes(all);
          setLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        document.getElementById("search-input")?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleAdd = useCallback(
    (lines: SessionLine[], eventDate: Date, sessionTitle?: string) => {
      const sessionId = newSessionId();
      const now = new Date();
      db.notes
        .bulkAdd(
          lines.map((l) => ({
            rawInput: l.rawInput,
            result: l.result,
            category: l.category,
            sessionTitle,
            createdAt: now,
            eventDate,
            sessionId,
          }))
        )
        .then(loadNotes);
    },
    [loadNotes]
  );

  const handleAddToSession = useCallback(
    async (
      sessionId: string,
      rawInput: string,
      result: number,
      category: string,
      eventDate: Date
    ) => {
      const sessionNotes = await db.notes
        .where("sessionId")
        .equals(sessionId)
        .toArray();
      const sessionTitle = sessionNotes.find((note) => note.sessionTitle?.trim())
        ?.sessionTitle;
      await db.notes.add({
        rawInput,
        result,
        category,
        sessionTitle,
        createdAt: new Date(),
        eventDate,
        sessionId,
      });
      await loadNotes();
    },
    [loadNotes]
  );

  const handleUpdateSessionTitle = useCallback(
    async (session: Note[], sessionTitle: string) => {
      const normalizedTitle = sessionTitle.trim() || undefined;
      const sessionId = session[0]?.sessionId;

      if (sessionId) {
        await db.notes
          .where("sessionId")
          .equals(sessionId)
          .modify({ sessionTitle: normalizedTitle });
      } else {
        const updates = session
          .map((note) => note.id)
          .filter((id): id is number => id != null)
          .map((key) => ({ key, changes: { sessionTitle: normalizedTitle } }));
        await db.notes.bulkUpdate(updates);
      }

      await loadNotes();
      setToast({ message: normalizedTitle ? "Titre modifié" : "Titre supprimé" });
      setTimeout(() => setToast(null), 3000);
    },
    [loadNotes]
  );

  const handleEdit = useCallback(
    (id: number, rawInput: string, result: number) => {
      db.notes.update(id, { rawInput, result }).then(loadNotes);
      setToast({ message: "Ligne modifiée" });
      setTimeout(() => setToast(null), 3000);
    },
    [loadNotes]
  );

  const handleDeleteRequest = useCallback((session: Note[]) => {
    setPendingDelete(session);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!pendingDelete || pendingDelete.length === 0) return;
    const deleted = pendingDelete;
    const ids = deleted
      .map((n) => n.id)
      .filter((id): id is number => id != null);
    db.notes.bulkDelete(ids).then(() => {
      loadNotes();
      setPendingDelete(null);
      setToast({
        message: "Session supprimée",
        undo: () => {
          const restored = deleted.map((line) => ({
            rawInput: line.rawInput,
            result: line.result,
            category: line.category,
            sessionTitle: line.sessionTitle,
            createdAt: line.createdAt,
            eventDate: line.eventDate,
            sessionId: line.sessionId,
          }));
          db.notes.bulkAdd(restored).then(() => {
            loadNotes();
            setToast(null);
          });
        },
      });
      setTimeout(() => setToast(null), 5000);
    });
  }, [pendingDelete, loadNotes]);

  const handleClearAll = useCallback(() => {
    db.notes.clear().then(() => {
      loadNotes();
      setClearAllOpen(false);
      setToast({ message: "Toutes les notes ont été supprimées" });
      setTimeout(() => setToast(null), 5000);
    });
  }, [loadNotes]);

  const handleImport = useCallback(
    (notesToImport: Omit<Note, "id">[]) => {
      return db.notes.bulkAdd(notesToImport).then(() => {
        loadNotes();
        return notesToImport.length;
      });
    },
    [loadNotes]
  );

  const filteredNotes = notes.filter((n) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const dateStr = new Date(eventDateOf(n))
        .toLocaleDateString("fr-FR")
        .toLowerCase();
      if (
        !n.rawInput.toLowerCase().includes(q) &&
        !n.sessionTitle?.toLowerCase().includes(q) &&
        !dateStr.includes(q) &&
        !n.category.toLowerCase().includes(q)
      ) {
        return false;
      }
    }

    if (dateRange.from || dateRange.to) {
      const d = new Date(eventDateOf(n));
      const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(d.getDate()).padStart(2, "0")}`;
      if (dateRange.from && day < dateRange.from) return false;
      if (dateRange.to && day > dateRange.to) return false;
    }

    return true;
  });

  const total = filteredNotes.reduce((sum, n) => sum + n.result, 0);

  const sessionKeys = new Set(
    filteredNotes.map((n) =>
      n.sessionId ? `s:${n.sessionId}` : `n:${n.id}`
    )
  );
  const sessionCount = sessionKeys.size;

  return (
    <ErrorBoundary>
      <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <header
          className="flex items-center justify-between px-4 pt-4 pb-2"
          style={{ paddingTop: "calc(1rem + env(safe-area-inset-top, 0px))" }}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Calculator className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Noter-O
              </h1>
              <span className="text-[10px] font-medium tracking-wide text-zinc-500 dark:text-zinc-400">
                A-Andreas
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => document.getElementById("search-input")?.focus()}
              className="sm:hidden p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Rechercher"
            >
              <Search className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
            </button>
            <InstallPrompt />
            <ExportButton notes={filteredNotes} onImport={handleImport} />
            <ThemeToggle />
          </div>
        </header>

        <NoteInput onAdd={handleAdd} onClearAll={() => setClearAllOpen(true)} />

        <Filters
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />

        <div
          className="flex-1 px-4 pb-24"
          style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom, 0px))" }}
        >
          <NoteList
            notes={filteredNotes}
            onDelete={handleDeleteRequest}
            onEdit={handleEdit}
            onUpdateSessionTitle={handleUpdateSessionTitle}
            onAddToSession={handleAddToSession}
            loaded={loaded}
          />
        </div>

        <TotalBar total={total} count={sessionCount} />

        {toast && (
          <Toast
            message={toast.message}
            onUndo={toast.undo}
            onDismiss={() => setToast(null)}
          />
        )}

        <ConfirmDialog
          open={pendingDelete !== null}
          title="Supprimer la session ?"
          message={`Supprimer ${pendingDelete?.length ?? 0} ligne${
            (pendingDelete?.length ?? 0) > 1 ? "s" : ""
          } ? Annulation possible 5 secondes.`}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />

        <ConfirmDialog
          open={clearAllOpen}
          title="Tout supprimer ?"
          message={`Supprimer définitivement ${notes.length} note${
            notes.length > 1 ? "s" : ""
          } ?`}
          onConfirm={handleClearAll}
          onCancel={() => setClearAllOpen(false)}
        />
      </div>
    </ErrorBoundary>
  );
}
