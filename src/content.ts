const APPROVE_COUNT_CLASS = "approve-count";

setInterval(run, 1000); // for spa navigation

let lock = false;
async function run() {
  if (lock) return;
  if (!location.href.includes("/pulls")) return;

  lock = true;
  try {
    await Promise.all(
      [...document.querySelectorAll(ROW_SELECTOR)].map((row) => processRow(row))
    );
  } finally {
    lock = false;
  }
}

/**
 * A pull request row on the list page.
 *
 * - Legacy (repository `/<owner>/<repo>/pulls`) pages render rows as `.Box-row`.
 * - The new GitHub Pull Requests page (https://github.com/pulls) is a React app
 *   whose rows are anchored by a stable `data-testid="issue-pr-title-link"`.
 */
const ROW_SELECTOR = ".Box-row, li:has(a[data-testid='issue-pr-title-link'])";

async function processRow(row: Element) {
  if (row.getElementsByClassName(APPROVE_COUNT_CLASS).length > 0) return; // already badged

  const ariaLabel = await findApproveCountAriaLabelByRow(row);
  if (ariaLabel == null) return;

  const approveCountString = /(\d+) review approval/.exec(ariaLabel)?.[1];
  const approveCount = Number(approveCountString || 0);

  if (row.matches(".Box-row")) {
    // Legacy repository pulls list.
    row.querySelector(".hide-sm")?.appendChild(createApproveCountBadge(approveCount));
  } else {
    // New React pull requests dashboard.
    insertBadgeIntoReactRow(row, approveCount);
  }
}

/**
 * The approval count is surfaced on a link whose accessible name is
 * e.g. "3 review approvals". This holds on both the legacy list and the new
 * React dashboard, so it's a stable hook across both.
 */
function findApproveCountLink(row: Element): HTMLAnchorElement | null {
  return (
    row.querySelector<HTMLAnchorElement>("a.Link--muted.tooltipped") ??
    row.querySelector<HTMLAnchorElement>("a[aria-label*='review approval']")
  );
}

/**
 * @returns e.g. 3 review approval
 */
async function findApproveCountAriaLabelByRow(row: Element): Promise<string | null> {
  const eachWaitMs = 100;
  let waitedMs = 0;
  while (waitedMs < 30000) {
    // maximum wait 30 seconds
    const ariaLabel = findApproveCountLink(row)?.getAttribute("aria-label");
    if (ariaLabel != null) return ariaLabel;

    await new Promise((res) => setTimeout(res, eachWaitMs));
    waitedMs += eachWaitMs;
  }
  return null;
}

/**
 * On the React dashboard the approval-count link is the most reliable anchor;
 * place the badge immediately after it so it lines up with the row metadata.
 * Falls back to the row's title link container when the link isn't present.
 */
function insertBadgeIntoReactRow(row: Element, approveCount: number) {
  const badge = createApproveCountBadge(approveCount);

  const approveLink = findApproveCountLink(row);
  if (approveLink?.parentElement) {
    approveLink.parentElement.appendChild(badge);
    return;
  }

  row
    .querySelector("a[data-testid='issue-pr-title-link']")
    ?.closest("div")
    ?.appendChild(badge);
}

function createApproveCountBadge(approveCount: number) {
  const span = document.createElement("span");
  span.classList.add(APPROVE_COUNT_CLASS);
  span.classList.add("ml-2", "flex-1", "flex-shrink-0");
  span.append(`✅ ${approveCount}`);

  return span;
}
