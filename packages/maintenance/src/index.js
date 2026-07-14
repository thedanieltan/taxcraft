export { extractSingaporeIndependent, extractSingaporePrimary, toText } from "./extract.js";
export { evaluateSingaporeUpdate, mergeAcceptedHistory } from "./evaluate.js";
export { applicableSchedule, planSingaporeModels } from "./lifecycle.js";
export {
  renderObservation,
  renderRetirementRecords,
  renderSingaporeModelData,
  renderSingaporeSources
} from "./render.js";
export {
  assertSingaporeObservation,
  canonicalObservation,
  observationsAgree,
  validateSingaporeObservation
} from "./validate.js";
export {
  assertUkObservation,
  canonicalUkObservation,
  evaluateUkUpdate,
  extractUkIndependent,
  extractUkPrimary,
  renderUkModelData,
  renderUkObservation,
  renderUkRetirements,
  renderUkSources,
  validateUkObservation
} from "./uk.js";
