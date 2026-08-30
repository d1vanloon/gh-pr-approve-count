const APPROVE_COUNT_CLASS = "approve-count";

/**
 * Rows on the React pull request dashboards (`/pulls`, `/pulls/inbox` and saved
 * views such as `/pulls/SSC_...`). Both the inbox and list layouts render rows
 * with the same `ListItem` CSS module; the hash suffix changes between GitHub
 * deploys, so match on the stable module-name prefix instead.
 */
const REACT_ROW_SELECTOR = 'li[class*="ListItem-module__listItem"]';

/** Rows on the legacy server-rendered repository pull request list. */
const LEGACY_ROW_SELECTOR = ".Box-row";

/**
 * The metadata line of a React row (repository, number, author, timestamp).
 * Present in every pull request row of both React layouts.
 */
const REACT_BADGE_TARGET_SELECTOR = 'div[class*="Description-module__container"]';

/**
 * Accessible descriptions Primer renders for a pull request's review state,
 * e.g. "2 review approvals", "1 review requesting changes" or
 * "Review required before merging".
 */
const REVIEW_DESCRIPTION_PATTERN = /reviews? approval|reviews? requesting changes|review required/i;

const APPROVE_COUNT_PATTERN = /(\d+) reviews? approval/;
const CHANGES_REQUESTED_COUNT_PATTERN = /(\d+) reviews? requesting changes/;

interface ReviewCounts {
  approved: number;
  changesRequested: number;
}

const NO_REVIEWS: ReviewCounts = { approved: 0, changesRequested: 0 };

let scheduled = false;
/**
 * React re-renders rows constantly (filtering, pagination, SPA navigation) and
 * portals the review tooltips in asynchronously, so re-run on any DOM change.
 * Runs converge: once every row is badged a pass makes no further mutations.
 */
function schedule() {
  if (scheduled) return;
  scheduled = true;
  setTimeout(() => {
    scheduled = false;
    decorateRows();
  }, 100);
}

new MutationObserver(schedule).observe(document.documentElement, {
  childList: true,
  subtree: true,
  // Review state can change in place. Watching only these attributes (which the
  // extension never writes) keeps the observer from reacting to its own badges.
  attributes: true,
  attributeFilter: ["aria-label", "aria-describedby"],
});
setInterval(schedule, 1000); // safety net for SPA navigation
schedule();

function decorateRows() {
  if (!location.pathname.includes("/pulls")) return;

  document.querySelectorAll(LEGACY_ROW_SELECTOR).forEach(decorateLegacyRow);
  document.querySelectorAll(REACT_ROW_SELECTOR).forEach(decorateReactRow);
}

function decorateReactRow(row: Element) {
  // Skip non-pull-request rows, such as the "Load more" affordance.
  if (row.querySelector('a[href*="/pull/"]') == null) return;

  const counts = findReviewCounts(row);
  const existing = row.getElementsByClassName(APPROVE_COUNT_CLASS)[0];
  if (existing != null) {
    // The review tooltip is portaled in asynchronously, so a row can be badged
    // before its review state is known. Keep the badge in sync afterwards.
    updateReviewBadge(existing as HTMLElement, counts);
    return;
  }

  if (!hasReviews(counts)) return;

  const badge = createReviewBadge(counts);
  badge.style.marginLeft = "4px";
  badge.style.whiteSpace = "nowrap";

  (row.querySelector(REACT_BADGE_TARGET_SELECTOR) ?? row).appendChild(badge);
}

function decorateLegacyRow(row: Element) {
  const description = findLegacyReviewDescription(row);
  if (description == null) return;

  const counts = parseReviewCounts(description);
  const existing = row.getElementsByClassName(APPROVE_COUNT_CLASS)[0];
  if (existing != null) {
    updateReviewBadge(existing as HTMLElement, counts);
    return;
  }

  if (!hasReviews(counts)) return;

  const badge = createReviewBadge(counts);
  badge.classList.add("ml-2", "flex-1", "flex-shrink-0");

  row.querySelector(".hide-sm")?.appendChild(badge);
}

/**
 * A legacy row can contain several tooltipped links (CI status, review state),
 * so pick the one that actually describes the review state rather than the
 * first one in the row.
 */
function findLegacyReviewDescription(row: Element): string | null {
  for (const link of row.querySelectorAll("a.Link--muted.tooltipped")) {
    const label = link.getAttribute("aria-label");
    if (label != null && REVIEW_DESCRIPTION_PATTERN.test(label)) return label;
  }
  return null;
}

/**
 * Reads how many reviews a React row has, defaulting to none when the pull
 * request has not been reviewed yet.
 */
function findReviewCounts(row: Element): ReviewCounts {
  const description = findReviewDescription(row);
  return description == null ? NO_REVIEWS : parseReviewCounts(description);
}

function hasReviews({ approved, changesRequested }: ReviewCounts): boolean {
  return approved > 0 || changesRequested > 0;
}

/**
 * The review state is announced by a Primer tooltip that React portals to the
 * end of `<body>`, so it cannot be found by searching within the row. Follow the
 * row's `aria-describedby` references to reach it.
 */
function findReviewDescription(row: Element): string | null {
  for (const element of row.querySelectorAll("[aria-describedby]")) {
    const ids = element.getAttribute("aria-describedby")?.split(/\s+/) ?? [];
    for (const id of ids) {
      const label = document.getElementById(id)?.getAttribute("aria-label");
      if (label != null && REVIEW_DESCRIPTION_PATTERN.test(label)) return label;
    }
  }
  return null;
}

/**
 * @param description e.g. "3 review approvals" or "1 review requesting changes"
 */
function parseReviewCounts(description: string): ReviewCounts {
  return {
    approved: Number(APPROVE_COUNT_PATTERN.exec(description)?.[1] ?? 0),
    changesRequested: Number(CHANGES_REQUESTED_COUNT_PATTERN.exec(description)?.[1] ?? 0),
  };
}

function createReviewBadge(counts: ReviewCounts) {
  const span = document.createElement("span");
  span.classList.add(APPROVE_COUNT_CLASS);
  updateReviewBadge(span, counts);

  return span;
}

/**
 * Renders the badge, or removes it entirely once a pull request no longer has
 * any reviews (the review state can change while the page is open).
 */
function updateReviewBadge(badge: HTMLElement, counts: ReviewCounts) {
  if (!hasReviews(counts)) {
    badge.remove();
    return;
  }

  const { approved, changesRequested } = counts;
  const signature = `${approved}/${changesRequested}`;
  if (badge.dataset["reviewCounts"] === signature) return;

  badge.dataset["reviewCounts"] = signature;
  badge.replaceChildren();

  const titles: string[] = [];
  if (approved > 0) {
    badge.append(`✅ ${approved}`);
    titles.push(`${approved} review ${approved === 1 ? "approval" : "approvals"}`);
  }
  if (changesRequested > 0) {
    const requested = document.createElement("span");
    requested.style.color = "var(--fgColor-danger, var(--color-danger-fg, #d1242f))";
    if (approved > 0) requested.style.marginLeft = "4px";
    requested.append(`❌ ${changesRequested}`);
    badge.appendChild(requested);
    titles.push(
      `${changesRequested} ${changesRequested === 1 ? "review" : "reviews"} requesting changes`,
    );
  }

  badge.title = titles.join(", ");
}
