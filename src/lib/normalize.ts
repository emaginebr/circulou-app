// Remove diacríticos comuns do português e aplica lowercase para comparação tolerante
// (ex.: "Café" === "cafe"). Usado pela busca cross-store (FR-001).
export const normalizeText = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
