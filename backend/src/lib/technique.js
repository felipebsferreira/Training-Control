const PYRAMID_TECHNIQUES = ["Pirâmide Crescente", "Pirâmide Decrescente"];

export function usesPerSetLoad(technique) {
  return PYRAMID_TECHNIQUES.includes(technique);
}
