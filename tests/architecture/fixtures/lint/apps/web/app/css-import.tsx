// Breaks: noRestrictedImports (CSS files and CSS modules outside the design system)
import "./global.css";
import styles from "./card.module.css";
import "./theme.scss";

export const card = styles;
