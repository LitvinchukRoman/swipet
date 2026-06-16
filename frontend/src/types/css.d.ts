/**
 * Type declarations for CSS modules and global CSS imports.
 */
declare module '*.css' {
  const styles: Record<string, string>;
  export default styles;
}

declare module '*.module.css' {
  const styles: Record<string, string>;
  export default styles;
}
