/**
 * Suprime o aviso de depreciação DEP0169 (`url.parse`) emitido pelo runtime do Node.
 *
 * Em produção (Vercel) esse warning passou a aparecer via dependências (ex.: stack
 * Express/Nest) após atualizações do runtime, poluindo os logs sem ação possível no
 * código da aplicação. Outros warnings continuam sendo exibidos normalmente.
 */
process.on("warning", (warning) => {
  if (
    warning.name === "DeprecationWarning" &&
    (warning as NodeJS.ErrnoException & { code?: string }).code === "DEP0169"
  ) {
    return;
  }

  console.warn(warning);
});
