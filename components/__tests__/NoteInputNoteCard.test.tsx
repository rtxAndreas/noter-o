import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NoteInput from "@/components/NoteInput";
import SessionCard from "@/components/SessionCard";
import type { Note } from "@/lib/db";

describe("NoteInput", () => {
  it("calls onAdd with a single line and today's date", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<NoteInput onAdd={onAdd} onClearAll={vi.fn()} />);

    const input = screen.getByPlaceholderText(/20000ar \(carburant\)/);
    await user.type(input, "20000ar (carburant) + 3000");
    await user.click(screen.getByRole("button", { name: "Ajouter" }));

    expect(onAdd).toHaveBeenCalledTimes(1);
    const [lines, date] = onAdd.mock.calls[0];
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      rawInput: "20000ar (carburant) + 3000",
      result: 23000,
    });
    expect(date).toBeInstanceOf(Date);
  });

  it("calls onAdd with multiple lines as one session", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<NoteInput onAdd={onAdd} onClearAll={vi.fn()} />);

    const input = screen.getByPlaceholderText(/20000ar \(carburant\)/);
    await user.type(
      input,
      "gouter 2000ar (operateur) 1000 bus\n100.000 (loyer) + 400.000 (provision)"
    );
    await user.click(screen.getByRole("button", { name: "Ajouter" }));

    expect(onAdd).toHaveBeenCalledTimes(1);
    const [lines] = onAdd.mock.calls[0];
    expect(lines).toHaveLength(2);
    expect(lines[0].result).toBe(3000);
    expect(lines[1].result).toBe(500000);
  });

  it("adds an optional title to the session and clears it", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<NoteInput onAdd={onAdd} onClearAll={vi.fn()} />);

    const title = screen.getByLabelText("Titre de la session");
    await user.type(title, "Courses du week-end");
    await user.type(
      screen.getByPlaceholderText(/20000ar \(carburant\)/),
      "2500 + 500"
    );
    await user.click(screen.getByRole("button", { name: "Ajouter" }));

    expect(onAdd.mock.calls[0][2]).toBe("Courses du week-end");
    expect(title).toHaveValue("");
  });

  it("clears the input after successful add", async () => {
    const user = userEvent.setup();
    render(<NoteInput onAdd={vi.fn()} onClearAll={vi.fn()} />);

    const input = screen.getByPlaceholderText(/20000ar \(carburant\)/);
    await user.type(input, "100 + 100");
    await user.click(screen.getByRole("button", { name: "Ajouter" }));

    expect(input).toHaveValue("");
  });

  it("shows an invalid marker and blocks submit for invalid lines", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<NoteInput onAdd={onAdd} onClearAll={vi.fn()} />);

    const input = screen.getByPlaceholderText(/20000ar \(carburant\)/);
    await user.type(input, "bonjour le monde");

    expect(screen.getByText("= invalide")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Ajouter" })
    ).not.toBeInTheDocument();
    expect(screen.getByText("Corriger la ligne")).toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("shows live results and running total for each line", async () => {
    const user = userEvent.setup();
    render(<NoteInput onAdd={vi.fn()} onClearAll={vi.fn()} />);

    const input = screen.getByPlaceholderText(/20000ar \(carburant\)/);
    await user.type(input, "2000ar (operateur) 1000 bus\n100.000 + 400.000");

    expect(screen.getByText("= 3 000 Ar")).toBeInTheDocument();
    expect(screen.getByText("= 500 000 Ar")).toBeInTheDocument();
    expect(screen.getByText("total =")).toBeInTheDocument();
    expect(screen.getByText("503 000 Ar")).toBeInTheDocument();
  });

  it("flags a specific invalid line in a multi-line input", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<NoteInput onAdd={onAdd} onClearAll={vi.fn()} />);

    const input = screen.getByPlaceholderText(/20000ar \(carburant\)/);
    await user.type(input, "2000 + 1000\ncafe pas frais\n500 + 500");

    expect(screen.getByText("= 3 000 Ar")).toBeInTheDocument();
    expect(screen.getAllByText("cafe pas frais").length).toBeGreaterThan(0);
    expect(screen.getAllByText("= invalide").length).toBeGreaterThan(0);
    expect(onAdd).not.toHaveBeenCalled();
  });
});

describe("SessionCard", () => {
  const lines: Note[] = [
    {
      id: 1,
      rawInput: "gouter 2000ar (operateur) 1000 bus",
      result: 3000,
      category: "Général",
      createdAt: new Date("2026-09-15T10:30:00"),
      eventDate: new Date(2026, 8, 15),
      sessionId: "sess-1",
    },
    {
      id: 2,
      rawInput: "loyer 100.000 (cent mille ariary) + provision 400.000 ar",
      result: 500000,
      category: "Loyer",
      createdAt: new Date("2026-09-15T10:31:00"),
      eventDate: new Date(2026, 8, 15),
      sessionId: "sess-1",
    },
  ];

  it("renders the session with lines and total", () => {
    render(<SessionCard lines={lines} onDelete={vi.fn()} onEdit={vi.fn()} />);

    expect(
      screen.getByText("gouter 2000ar (operateur) 1000 bus")
    ).toBeInTheDocument();
    expect(
      screen.getByText("loyer 100.000 (cent mille ariary) + provision 400.000 ar")
    ).toBeInTheDocument();
    expect(screen.getByText("total =")).toBeInTheDocument();
    expect(screen.getByText("503 000")).toBeInTheDocument();
    expect(screen.getByText("15 sept. 2026")).toBeInTheDocument();
  });

  it("edits a line inline", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<SessionCard lines={lines} onDelete={vi.fn()} onEdit={onEdit} />);

    const editButtons = screen.getAllByLabelText("Modifier la ligne");
    await user.click(editButtons[0]);

    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "gouter 2000 (operateur) + 1000 car");
    await user.click(screen.getByLabelText("Enregistrer"));

    expect(onEdit).toHaveBeenCalledWith(1, "gouter 2000 (operateur) + 1000 car", 3000);
  });

  it("calls onDelete with all session lines", () => {
    const onDelete = vi.fn();
    render(<SessionCard lines={lines} onDelete={onDelete} onEdit={vi.fn()} />);

    const deleteButtons = screen.getAllByLabelText("Supprimer la session");
    fireEvent.click(deleteButtons[deleteButtons.length - 1]);
    expect(onDelete).toHaveBeenCalledWith(lines);
  });

  it("adds a note to an existing session with its chosen date", async () => {
    const user = userEvent.setup();
    const onAddToSession = vi.fn();
    render(
      <SessionCard
        lines={lines}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onAddToSession={onAddToSession}
      />
    );

    await user.click(screen.getByRole("button", { name: /Ajouter une note à cette session/ }));
    await user.type(screen.getByLabelText("Nouvelle note"), "750 + 250");
    await user.clear(screen.getByLabelText("Date de la nouvelle note"));
    await user.type(screen.getByLabelText("Date de la nouvelle note"), "2026-09-20");
    await user.click(screen.getByLabelText("Enregistrer la nouvelle note"));

    expect(onAddToSession).toHaveBeenCalledWith(
      "sess-1",
      "750 + 250",
      1000,
      "Général",
      new Date(2026, 8, 20)
    );
  });

  it("edits the session title", async () => {
    const user = userEvent.setup();
    const onUpdateSessionTitle = vi.fn();
    const titledLines = lines.map((line) => ({
      ...line,
      sessionTitle: "Ancien titre",
    }));
    render(
      <SessionCard
        lines={titledLines}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onUpdateSessionTitle={onUpdateSessionTitle}
      />
    );

    expect(screen.getByText("Ancien titre")).toBeInTheDocument();
    await user.click(screen.getByLabelText("Modifier le titre de la session"));
    const input = screen.getByLabelText("Modifier le titre de la session");
    await user.clear(input);
    await user.type(input, "Nouveau titre");
    await user.click(screen.getByLabelText("Enregistrer le titre de la session"));

    expect(onUpdateSessionTitle).toHaveBeenCalledWith(
      titledLines,
      "Nouveau titre"
    );
  });
});
