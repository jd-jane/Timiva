/**
 * Tool-agnostic lunar domain public API.
 *
 * Intended reuse（e.g. future 年歲對照）：
 * - yearStemBranch / getLunarYearInfo / leapMonthOfYear
 * - gregorianToLunar / lunarToGregorian
 * - validatePublicGregorian / validatePublicLunar
 * - buildLunarResultParts / buildGregorianResultParts
 *
 * Not coupled to Lunar Date Converter UI / ResultSummary / controllers.
 */

export {
	LUNAR_DATASET_YEAR_MAX,
	LUNAR_DATASET_YEAR_MIN,
	LUNAR_PUBLIC_YEAR_MAX,
	LUNAR_PUBLIC_YEAR_MIN,
	type CivilDate,
	type LunarConvertErr,
	type LunarConvertOk,
	type LunarConvertResult,
	type LunarDate,
	type LunarMonthRef,
	type LunarYearInfo,
	type StemBranch,
} from "./lunarTypes.ts";

export {
	LUNAR_DATASET_PROVENANCE,
	LUNAR_EPOCH_CIVIL,
	LUNAR_YEAR_PACKED,
} from "./lunarDataset.ts";

export {
	addCivilDays,
	civilDatesEqual,
	civilToDayNumber,
	civilWeekday,
	dayNumberToCivil,
	daysInGregorianMonth,
	isGregorianLeapYear,
	isValidCivilDate,
} from "./lunarCivil.ts";

export {
	assertLunarDatasetIntegrity,
	daysInLunarMonth,
	getLunarYearInfo,
	leapMonthDays,
	leapMonthOfYear,
	listLunarMonths,
	lunarNewYearCivil,
	lunarYearTotalDays,
	regularMonthDays,
} from "./lunarYearInfo.ts";

export {
	gregorianToLunar,
	isPublicGregorianInput,
	isPublicLunarYear,
	lunarToGregorian,
} from "./lunarConvert.ts";

export { yearStemBranch, yearStemBranchIndex } from "./lunarStemBranch.ts";

export {
	validatePublicGregorian,
	validatePublicLunar,
	type LunarValidation,
} from "./lunarValidate.ts";

export {
	buildGregorianResultParts,
	buildLunarResultParts,
	formatLunarDayCellZh,
	formatLunarDayZh,
	formatLunarMonthZh,
	type GregorianResultParts,
	type LunarResultParts,
} from "./lunarFormat.ts";
