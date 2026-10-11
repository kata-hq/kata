// Inside the design system the styling plugins and the CSS import rule do not apply.
import * as stylex from "@stylexjs/stylex";
import "./reset.css";

const styles = stylex.create({ raw: { color: "#ff0000", padding: "12px" } });

export const Raw = () => <div style={{ padding: 8 }} className="raw" {...stylex.props(styles.raw)} />;
