export async function renderMermaidBlocks(querySelector: string, isCanceled = () => false) {
  if (!document.querySelector(querySelector)) return;
  const { default: mermaid } = await import('mermaid');
  if (isCanceled()) return;

  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'strict',
    flowchart: { useMaxWidth: true, htmlLabels: true }
  });
  await mermaid.run({ querySelector });
}
