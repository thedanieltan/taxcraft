import {
  progressiveReliefPackages as acceptedPackages,
  progressiveReliefPackagesByJurisdiction as acceptedPackagesByJurisdiction,
} from "./base.js";
import { southAfricaPackage } from "./south-africa.js";
import { malaysiaPackage } from "./malaysia.js";
import { czechRepublicPackage } from "./czech-republic.js";
import { indonesiaPackage } from "./indonesia.js";
import { ghanaPackage } from "./ghana.js";
import { mauritiusPackage } from "./mauritius.js";
import { sriLankaPackage } from "./sri-lanka.js";
import { eswatiniPackage } from "./eswatini.js";
import { jamaicaPackage } from "./jamaica.js";
import { lesothoPackage } from "./lesotho.js";
import { guyanaPackage } from "./guyana.js";
import { liberiaPackage } from "./liberia.js";
import { saintLuciaPackage } from "./saint-lucia.js";
import { namibiaPackage } from "./namibia.js";
import { southKoreaPackage } from "./south-korea.js";
import { kazakhstanPackage } from "./kazakhstan.js";
import { tunisiaPackage } from "./tunisia.js";

export const progressiveReliefPackages = Object.freeze([
  ...acceptedPackages,
  southAfricaPackage,
  malaysiaPackage,
  czechRepublicPackage,
  indonesiaPackage,
  ghanaPackage,
  mauritiusPackage,
  sriLankaPackage,
  eswatiniPackage,
  jamaicaPackage,
  lesothoPackage,
  guyanaPackage,
  liberiaPackage,
  saintLuciaPackage,
  namibiaPackage,
  southKoreaPackage,
  kazakhstanPackage,
  tunisiaPackage,
]);

export const progressiveReliefPackagesByJurisdiction = Object.freeze({
  ...acceptedPackagesByJurisdiction,
  ZA: southAfricaPackage,
  MY: malaysiaPackage,
  CZ: czechRepublicPackage,
  ID: indonesiaPackage,
  GH: ghanaPackage,
  MU: mauritiusPackage,
  LK: sriLankaPackage,
  SZ: eswatiniPackage,
  JM: jamaicaPackage,
  LS: lesothoPackage,
  GY: guyanaPackage,
  LR: liberiaPackage,
  LC: saintLuciaPackage,
  NA: namibiaPackage,
  KR: southKoreaPackage,
  KZ: kazakhstanPackage,
  TN: tunisiaPackage,
});

export {
  southAfricaPackage,
  malaysiaPackage,
  czechRepublicPackage,
  indonesiaPackage,
  ghanaPackage,
  mauritiusPackage,
  sriLankaPackage,
  eswatiniPackage,
  jamaicaPackage,
  lesothoPackage,
  guyanaPackage,
  liberiaPackage,
  saintLuciaPackage,
  namibiaPackage,
  southKoreaPackage,
  kazakhstanPackage,
  tunisiaPackage,
};
