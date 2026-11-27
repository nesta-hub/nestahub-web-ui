import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_WHATSAPP_CHOICE,
  resolveWhatsAppChoice,
  validateWhatsAppChoice,
  WhatsAppNumberField,
  type WhatsAppChoice,
} from "./WhatsAppNumberField";

const useSubscribeEnabled = vi.fn();
vi.mock("@/hooks/useSubscribeEnabled", () => ({ useSubscribeEnabled: () => useSubscribeEnabled() }));

beforeEach(() => {
  useSubscribeEnabled.mockReturnValue(true);
});

/** The field the way a form holds it: the parent keeps the choice. */
function Form({ phone = "0801 234 5678", initial = DEFAULT_WHATSAPP_CHOICE, error = null, onChange = vi.fn() }: {
  phone?: string;
  initial?: WhatsAppChoice;
  error?: string | null;
  onChange?: (v: WhatsAppChoice) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <WhatsAppNumberField
      phone={phone}
      value={value}
      error={error}
      onChange={(v) => {
        setValue(v);
        onChange(v);
      }}
    />
  );
}

const tick = () => screen.getByRole("checkbox", { name: "This is my WhatsApp number" });

describe("the WhatsApp tick box", () => {
  it("is ticked to begin with, with no second number to type", () => {
    render(<Form />);

    expect(tick()).toBeChecked();
    expect(screen.queryByLabelText("WhatsApp number")).toBeNull();
  });

  it("shows a WhatsApp number to type when it is unticked", () => {
    const onChange = vi.fn();
    render(<Form onChange={onChange} />);

    fireEvent.click(tick());

    expect(tick()).not.toBeChecked();
    expect(onChange).toHaveBeenLastCalledWith({ sameAsPhone: false, whatsappNumber: "" });
    const input = screen.getByLabelText("WhatsApp number");
    expect(input).toHaveAttribute("inputmode", "tel");
    expect(input).toHaveAttribute("type", "tel");
  });

  it("hands back what she types", () => {
    const onChange = vi.fn();
    render(<Form initial={{ sameAsPhone: false, whatsappNumber: "" }} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("WhatsApp number"), { target: { value: "0803 111 2222" } });

    expect(onChange).toHaveBeenLastCalledWith({ sameAsPhone: false, whatsappNumber: "0803 111 2222" });
  });

  it("hides the number again when she ticks it back, keeping what she typed", () => {
    const onChange = vi.fn();
    render(<Form initial={{ sameAsPhone: false, whatsappNumber: "0803 111 2222" }} onChange={onChange} />);

    fireEvent.click(tick());

    expect(screen.queryByLabelText("WhatsApp number")).toBeNull();
    expect(onChange).toHaveBeenLastCalledWith({ sameAsPhone: true, whatsappNumber: "0803 111 2222" });
  });

  it("shows the error under the number she is typing", () => {
    render(<Form initial={{ sameAsPhone: false, whatsappNumber: "0803" }} error="Enter a Nigerian mobile number, like 0801 234 5678" />);

    expect(screen.getByRole("alert")).toHaveTextContent("Enter a Nigerian mobile number, like 0801 234 5678");
    expect(screen.getByLabelText("WhatsApp number")).toHaveAttribute("aria-invalid", "true");
  });

  it("says so when the phone above is not a mobile, and still lets her go on", () => {
    render(<Form phone="0101 234 5678" />);

    expect(screen.getByText(/doesn't look like a Nigerian mobile number/)).toBeInTheDocument();
    expect(tick()).toBeChecked();
  });

  it("says nothing about a phone that is still being typed", () => {
    render(<Form phone="0801 23" />);

    expect(screen.queryByText(/doesn't look like/)).toBeNull();
  });

  it("gives each copy on a page its own ids", () => {
    render(
      <>
        <Form />
        <Form />
      </>,
    );

    const ids = screen.getAllByRole("checkbox").map((c) => c.id);
    expect(new Set(ids).size).toBe(2);
  });
});

describe("when the subscription experience is off", () => {
  it("renders nothing at all", () => {
    useSubscribeEnabled.mockReturnValue(false);

    const { container } = render(<Form />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe("resolveWhatsAppChoice", () => {
  it("uses the profile phone when the box is ticked and the phone is a mobile", () => {
    expect(resolveWhatsAppChoice({ sameAsPhone: true, whatsappNumber: "" }, "0801 234 5678")).toEqual({ useProfilePhone: true });
  });

  it("sends nothing when the box is ticked but the phone is not a mobile", () => {
    expect(resolveWhatsAppChoice({ sameAsPhone: true, whatsappNumber: "" }, "0101 234 5678")).toBeNull();
    expect(resolveWhatsAppChoice({ sameAsPhone: true, whatsappNumber: "" }, "")).toBeNull();
  });

  it("sends the number she typed when the box is unticked, ignoring the phone", () => {
    expect(resolveWhatsAppChoice({ sameAsPhone: false, whatsappNumber: " 0803 111 2222 " }, "0801 234 5678")).toEqual({
      whatsappNumber: "0803 111 2222",
    });
  });

  it("sends nothing when the typed number is not a mobile", () => {
    expect(resolveWhatsAppChoice({ sameAsPhone: false, whatsappNumber: "0803" }, "0801 234 5678")).toBeNull();
    expect(resolveWhatsAppChoice({ sameAsPhone: false, whatsappNumber: "" }, "0801 234 5678")).toBeNull();
  });
});

describe("validateWhatsAppChoice", () => {
  it("has no complaint when the box is ticked", () => {
    expect(validateWhatsAppChoice({ sameAsPhone: true, whatsappNumber: "" })).toBeNull();
    expect(validateWhatsAppChoice({ sameAsPhone: true, whatsappNumber: "junk" })).toBeNull();
  });

  it("has no complaint about a good typed number, in any common form", () => {
    for (const typed of ["0803 111 2222", "+234 803 111 2222", "803 111 2222"]) {
      expect(validateWhatsAppChoice({ sameAsPhone: false, whatsappNumber: typed })).toBeNull();
    }
  });

  it("asks for a Nigerian mobile when the box is unticked and the number is empty or wrong", () => {
    const message = "Enter a Nigerian mobile number, like 0801 234 5678";
    expect(validateWhatsAppChoice({ sameAsPhone: false, whatsappNumber: "" })).toBe(message);
    expect(validateWhatsAppChoice({ sameAsPhone: false, whatsappNumber: "0803 111" })).toBe(message);
  });
});
