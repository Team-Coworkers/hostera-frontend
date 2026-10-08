import { UrlMatcher, UrlSegment } from '@angular/router';

/**
 * Builds a route matcher for `:id` followed by fixed segments, where the id is numeric,
 * as the `:id(\\d+)` paths of the Vue router.
 * @param suffix - Fixed segments after the id, such as `['edit']`.
 * @returns Matcher that exposes the id as the `id` parameter.
 */
export function numericIdMatcher(...suffix: string[]): UrlMatcher {
  return (segments: UrlSegment[]) => {
    const [id, ...rest] = segments;
    if (
      !id ||
      !/^\d+$/.test(id.path) ||
      rest.length !== suffix.length ||
      rest.some((segment, index) => segment.path !== suffix[index])
    )
      return null;
    return { consumed: segments, posParams: { id } };
  };
}
