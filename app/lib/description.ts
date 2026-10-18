/**
 * Short summary for the PDP buy box: the first paragraph of the product's
 * HTML description. The full description lives in the "Product Details"
 * accordion, so repeating it above the Order-now button only pushes the
 * button down the page.
 */
export function getDescriptionSummary(descriptionHtml: string | null | undefined): string {
  if (!descriptionHtml) return '';
  const firstParagraph = descriptionHtml.match(/<p[\s>][\s\S]*?<\/p>/i)?.[0];
  if (firstParagraph) return firstParagraph;
  // No <p> wrapper: take everything before the first heading/list/rule.
  return descriptionHtml.split(/<(?:h[1-6]|ul|ol|hr)[\s>]/i)[0].trim();
}
