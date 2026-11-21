/**
 * Suprime o aviso de depreciação DEP0169 (`url.parse`) emitido pelo runtime do Node.
 *
 * Mantido dentro de `api/` para garantir que o entrypoint serverless da Vercel
 * consiga carregá-lo sem depender de resolução fora deste diretório.
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
