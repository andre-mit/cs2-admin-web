<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Coding Standards for Agents
1. **No `any` Types:** Do not use `any` in TypeScript files. Ensure all variables, arguments, and returns are properly typed. Extend interfaces (like `Session`) instead of casting with `as any`.
2. **English Only for Logs:** All `console.log` statements, `alert`s, and server-side logs must be in English for consistency.
3. **Crucial Comments Only:** Only add comments that explain non-obvious logic. Do not over-comment standard code flows.
