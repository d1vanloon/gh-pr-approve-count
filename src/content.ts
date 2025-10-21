const APPROVE_COUNT_CLASS = "approve-count";

setInterval(run, 1000); // for spa navigation

let lock = false;
async function run() {
  if (lock) return;
  if (!location.href.includes("/pulls")) return;
  if (document.getElementsByClassName(APPROVE_COUNT_CLASS).length > 0) return;

  lock = true;
  await Promise.all(
    [...document.querySelectorAll(".Box-row")].map(async (row) => {
      const ariaLabel = await findApproveCountAriaLabelByRow(row);
      if (ariaLabel == null) return;

      const approveCountString = /(\d+) review approval/.exec(ariaLabel)?.[1];
      row
        .querySelector(".hide-sm")
        ?.appendChild(createApproveCountBadge(Number(approveCountString || 0)));
    })
  );
  lock = false;
}

/**
 * @returns e.g. 3 review approval
 */
async function findApproveCountAriaLabelByRow(row: Element): Promise<string | null> {
  const eachWaitMs = 100;
  let waitedMs = 0;
  while (waitedMs < 30000) {
    // maximum wait 30 seconds
    const ariaLabel = row.querySelector("a.Link--muted.tooltipped")?.getAttribute("aria-label");
    if (ariaLabel != null) return ariaLabel;

    await new Promise((res) => setTimeout(res, eachWaitMs));
    waitedMs += eachWaitMs;
  }
  return null;
}

function createApproveCountBadge(approveCount: number) {
  const span = document.createElement("span");
  span.classList.add(APPROVE_COUNT_CLASS);
  span.classList.add("ml-2", "flex-1", "flex-shrink-0");
  span.append(`✅ ${approveCount}`);

  return span;
}
