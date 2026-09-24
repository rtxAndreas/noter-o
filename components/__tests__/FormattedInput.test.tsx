import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FormattedInput from "@/components/FormattedInput";
import MultiplicationExample from "@/components/MultiplicationExample";

function ControlledInput({
  initialValue = "",
  onRawChange = vi.fn(),
}: {
  initialValue?: string;
  onRawChange?: (value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);

  return (
    <FormattedInput
      aria-label="Montant"
      value={value}
      onValueChange={(nextValue) => {
        setValue(nextValue);
        onRawChange(nextValue);
      }}
    />
  );
}

describe("FormattedInput", () => {
  it("formats while keeping raw digits in state", async () => {
    const user = userEvent.setup();
    const onRawChange = vi.fn();
    render(<ControlledInput onRawChange={onRawChange} />);

    const input = screen.getByRole("textbox", { name: "Montant" });
    await user.type(input, "3000000");

    expect(input).toHaveValue("3 000 000");
    expect(onRawChange).toHaveBeenLastCalledWith("3000000");
  });

  it("removes non-digit characters", () => {
    const onRawChange = vi.fn();
    render(<ControlledInput onRawChange={onRawChange} />);

    fireEvent.change(screen.getByRole("textbox", { name: "Montant" }), {
      target: { value: "12abc345" },
    });

    expect(screen.getByRole("textbox", { name: "Montant" })).toHaveValue(
      "12 345"
    );
    expect(onRawChange).toHaveBeenLastCalledWith("12345");
  });

  it("keeps the caret next to the edited digit in the middle", async () => {
    const user = userEvent.setup();
    render(<ControlledInput initialValue="123456" />);
    const input = screen.getByRole("textbox", { name: "Montant" }) as HTMLInputElement;
    input.setSelectionRange(2, 2);

    await user.type(input, "9", { initialSelectionStart: 2, initialSelectionEnd: 2 });

    expect(input).toHaveValue("1 293 456");
    expect(input.selectionStart).toBe(4);
  });
});

describe("MultiplicationExample", () => {
  it("updates and formats the multiplication result", () => {
    render(<MultiplicationExample />);

    fireEvent.change(screen.getByLabelText("Montant à multiplier"), {
      target: { value: "3000000" },
    });
    fireEvent.change(screen.getByLabelText("Multiplicateur"), {
      target: { value: "2" },
    });

    expect(
      screen.getByLabelText("Résultat de la multiplication")
    ).toHaveTextContent("6 000 000");
  });
});
