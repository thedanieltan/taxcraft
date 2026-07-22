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
import { sloveniaPackage } from "./slovenia.js";
import { slovakiaPackage } from "./slovakia.js";
import { austriaPackage } from "./austria.js";
import { turkeyPackage } from "./turkey.js";
import { peruPackage } from "./peru.js";
import { colombiaPackage } from "./colombia.js";
import { greecePackage } from "./greece.js";
import { jordanPackage } from "./jordan.js";
import { jerseyPackage } from "./jersey.js";

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
  sloveniaPackage,
  slovakiaPackage,
  austriaPackage,
  turkeyPackage,
  peruPackage,
  colombiaPackage,
  greecePackage,
  jordanPackage,
  jerseyPackage,
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
  SI: sloveniaPackage,
  SK: slovakiaPackage,
  AT: austriaPackage,
  TR: turkeyPackage,
  PE: peruPackage,
  CO: colombiaPackage,
  GR: greecePackage,
  JO: jordanPackage,
  JE: jerseyPackage,
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
  sloveniaPackage,
  slovakiaPackage,
  austriaPackage,
  turkeyPackage,
  peruPackage,
  colombiaPackage,
  greecePackage,
  jordanPackage,
  jerseyPackage,
};
