
/// <reference types="vite/client" />

// Path aliases
declare module '@/*' {
  const value: any;
  export default value;
}
