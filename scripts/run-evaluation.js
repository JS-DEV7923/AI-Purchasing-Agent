import { store } from "../src/repository/store.js";
import { runEvaluation } from "../src/services/evaluation.js";

const report = runEvaluation(store, { resetState: true, scenarioIds: null });
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.summary.failed === 0 ? 0 : 1;
