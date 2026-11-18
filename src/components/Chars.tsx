const CHAR_STYLE = { display: "inline-block", whiteSpace: "pre" } as const;

/** Renders one span per character, for the letter-by-letter reveal. */
export default function Chars({ text }: { text: string }) {
  return (
    <>
      {Array.from(text).map((c, i) => (
        <span key={i} data-char="" style={CHAR_STYLE}>
          {c}
        </span>
      ))}
    </>
  );
}
