export function synthesizeExplanation(decision) {
  const checks = decision.constraintsChecked || [];
  const failed = checks.filter((check) => check.status === "failed").map((check) => check.summary);
  const warnings = checks.filter((check) => check.status === "warning").map((check) => check.summary);
  const evidence = decision.evidence?.slice(0, 3).join(" ");
  const suffix = failed.length > 0
    ? ` Blocking issues: ${failed.join(" ")}`
    : warnings.length > 0
      ? ` Watch-outs: ${warnings.join(" ")}`
      : " All hard constraints passed.";
  return `${decision.summary} ${evidence || ""}${suffix}`.trim();
}
