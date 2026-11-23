/** Estilos compartidos por login y registro (usan los tokens de styles/_tokens.scss). */
export const AUTH_FORM_STYLES = `
  :host { display: block; }
  .wrap { max-width: 440px; margin: 0 auto; padding: var(--s-6) var(--s-4); }
  form { display: flex; flex-direction: column; gap: var(--s-4); padding: var(--s-6); }
  h1 { margin: 0; }
  .sub { margin: 0; color: var(--c-text-muted); }
  label { display: flex; flex-direction: column; gap: var(--s-2); font-weight: 700; }
  input {
    padding: 12px 14px; border-radius: var(--r-md); border: 2px solid var(--c-border);
    background: var(--c-surface); font-size: 1rem;
  }
  input:focus-visible { outline: 3px solid var(--c-secondary); outline-offset: 2px; border-color: var(--c-secondary); }
  .alt { margin: 0; text-align: center; color: var(--c-text-muted); }
  .alt a { color: var(--c-secondary-strong); font-weight: 700; }
`;
