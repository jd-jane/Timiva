/**
 * Lunar Date Converter AME adapter（B2D Corrective）.
 * Structured Year／Month／Day picker；無文字輸入、無 native keyboard、無 DesktopCalendar。
 * lifecycle = live：picker／切換／Reset 即時寫入；Done 只關閉 AME。
 */
import {
	MAX_GREGORIAN,
	MIN_GREGORIAN,
} from "../lib/lunarDateConverterGregorianInput.ts";
import {
	civilFromLunarInput,
	getLocalTodayCivil,
	type InputMode,
} from "../lib/lunarDateConverterEvaluate.ts";
import {
	daysInGregorianMonth,
	formatLunarMonthZh,
	gregorianToLunar,
	isPublicGregorianInput,
	listLunarMonths,
	LUNAR_PUBLIC_YEAR_MAX,
	LUNAR_PUBLIC_YEAR_MIN,
} from "../lib/lunar/index.ts";
import {
	formatLunarMonthOptionEn,
	lunarDayCellLabel,
} from "../lib/lunarCalendarGrid.ts";
import type { CivilDate, LunarMonthRef } from "../lib/lunar/lunarTypes.ts";
import type { AmeDraftBag, AmeValidateResult } from "./adaptive-mobile-editor-controller";

export type LdcAmeMode = InputMode;

export type LdcAmeGregorianParts = {
	year: number;
	month: number;
	day: number;
};

export type LdcAmeLunarParts = {
	year: number;
	month: number;
	day: number;
	isLeapMonth: boolean;
};

export type LdcAmeDraft = AmeDraftBag & {
	mode: LdcAmeMode;
	gregorian: LdcAmeGregorianParts;
	lunar: LdcAmeLunarParts;
};

export type LdcAmeLocale = "en" | "zh";

export type LdcAmePickerOption = {
	value: string;
	label: string;
};

function cloneGregorian(source: LdcAmeGregorianParts): LdcAmeGregorianParts {
	return { year: source.year, month: source.month, day: source.day };
}

function cloneLunar(source: LdcAmeLunarParts): LdcAmeLunarParts {
	return {
		year: source.year,
		month: source.month,
		day: source.day,
		isLeapMonth: Boolean(source.isLeapMonth),
	};
}

export function cloneLdcAmeDraft(source: LdcAmeDraft): LdcAmeDraft {
	return {
		mode: source.mode === "lunar" ? "lunar" : "gregorian",
		gregorian: cloneGregorian(source.gregorian),
		lunar: cloneLunar(source.lunar),
	};
}

export function lunarMonthValue(month: number, isLeapMonth: boolean): string {
	return `${month}:${isLeapMonth ? "1" : "0"}`;
}

export function parseLunarMonthValue(
	value: string,
): { month: number; isLeapMonth: boolean } | null {
	const match = /^(\d{1,2}):([01])$/.exec(value);
	if (!match) return null;
	return { month: Number(match[1]), isLeapMonth: match[2] === "1" };
}

function fallbackLunarParts(civil: CivilDate): LdcAmeLunarParts {
	return {
		year: Math.min(LUNAR_PUBLIC_YEAR_MAX, Math.max(LUNAR_PUBLIC_YEAR_MIN, civil.year)),
		month: 1,
		day: 1,
		isLeapMonth: false,
	};
}

export function clampGregorianParts(parts: LdcAmeGregorianParts): LdcAmeGregorianParts {
	const year = Math.min(
		MAX_GREGORIAN.year,
		Math.max(MIN_GREGORIAN.year, Math.trunc(parts.year) || MIN_GREGORIAN.year),
	);
	const month = Math.min(12, Math.max(1, Math.trunc(parts.month) || 1));
	const maxDay = daysInGregorianMonth(year, month);
	const day = Math.min(maxDay, Math.max(1, Math.trunc(parts.day) || 1));
	return { year, month, day };
}

export function clampLunarParts(parts: LdcAmeLunarParts): LdcAmeLunarParts {
	let year = Math.trunc(parts.year) || LUNAR_PUBLIC_YEAR_MIN;
	let months = listLunarMonths(year);
	if (!months || months.length === 0) {
		year = LUNAR_PUBLIC_YEAR_MIN;
		months = listLunarMonths(year) ?? [];
	}
	const wantedLeap = Boolean(parts.isLeapMonth);
	const wantedMonth = Math.trunc(parts.month) || 1;
	const ref: LunarMonthRef =
		months.find((item) => item.month === wantedMonth && item.isLeapMonth === wantedLeap) ??
		months.find((item) => item.month === wantedMonth && !item.isLeapMonth) ??
		months[0]!;
	const day = Math.min(ref.days, Math.max(1, Math.trunc(parts.day) || 1));
	return {
		year,
		month: ref.month,
		isLeapMonth: ref.isLeapMonth,
		day,
	};
}

function lunarPartsFromCivil(civil: CivilDate): LdcAmeLunarParts {
	const lunar = gregorianToLunar(civil);
	if (!lunar.ok) {
		return fallbackLunarParts(civil);
	}
	return clampLunarParts(lunar.value);
}

export function draftFromCommitted(civil: CivilDate, mode: LdcAmeMode): LdcAmeDraft {
	const gregorian = clampGregorianParts(civil);
	return {
		mode: mode === "lunar" ? "lunar" : "gregorian",
		gregorian,
		lunar: lunarPartsFromCivil(civil),
	};
}

export function ldcAmeResetDraft(): LdcAmeDraft {
	return draftFromCommitted(getLocalTodayCivil(), "gregorian");
}

export type LdcAmeResolveResult =
	| { ok: true; civil: CivilDate; mode: LdcAmeMode }
	| { ok: false; message: string };

function resolveGregorianParts(parts: LdcAmeGregorianParts): LdcAmeResolveResult {
	const civil = clampGregorianParts(parts);
	if (!isPublicGregorianInput(civil)) {
		return { ok: false, message: "invalid" };
	}
	return { ok: true, civil, mode: "gregorian" };
}

function resolveLunarParts(parts: LdcAmeLunarParts): LdcAmeResolveResult {
	const lunar = clampLunarParts(parts);
	const civil = civilFromLunarInput(lunar);
	if (!civil) {
		return { ok: false, message: "invalid" };
	}
	return { ok: true, civil, mode: "lunar" };
}

export function resolveLdcAmeDraft(draft: LdcAmeDraft): LdcAmeResolveResult {
	if (draft.mode === "lunar") {
		return resolveLunarParts(draft.lunar);
	}
	return resolveGregorianParts(draft.gregorian);
}

export function validateLdcAmeDraft(draft: LdcAmeDraft): AmeValidateResult {
	const resolved = resolveLdcAmeDraft(draft);
	if (resolved.ok) {
		return { ok: true };
	}
	return { ok: false, message: resolved.message };
}

export function switchLdcAmeDraft(draft: LdcAmeDraft, nextMode: LdcAmeMode): LdcAmeDraft {
	if (draft.mode === nextMode) {
		return cloneLdcAmeDraft(draft);
	}
	const resolved = resolveLdcAmeDraft(draft);
	if (resolved.ok) {
		return draftFromCommitted(resolved.civil, nextMode);
	}
	return { ...cloneLdcAmeDraft(draft), mode: nextMode };
}

export function applyLdcAmeGregorianChange(
	draft: LdcAmeDraft,
	partial: Partial<LdcAmeGregorianParts>,
): LdcAmeDraft {
	return {
		...cloneLdcAmeDraft(draft),
		mode: "gregorian",
		gregorian: clampGregorianParts({ ...draft.gregorian, ...partial }),
	};
}

export function applyLdcAmeLunarChange(
	draft: LdcAmeDraft,
	partial: Partial<LdcAmeLunarParts>,
): LdcAmeDraft {
	return {
		...cloneLdcAmeDraft(draft),
		mode: "lunar",
		lunar: clampLunarParts({ ...draft.lunar, ...partial }),
	};
}

function yearOptions(min: number, max: number, extra?: number): LdcAmePickerOption[] {
	const years = new Set<number>();
	for (let year = min; year <= max; year += 1) {
		years.add(year);
	}
	if (typeof extra === "number" && Number.isInteger(extra)) {
		years.add(extra);
	}
	return [...years]
		.sort((a, b) => a - b)
		.map((year) => ({ value: String(year), label: String(year) }));
}

export function gregorianYearOptions(selectedYear?: number): LdcAmePickerOption[] {
	return yearOptions(MIN_GREGORIAN.year, MAX_GREGORIAN.year, selectedYear);
}

export function gregorianMonthOptions(locale: LdcAmeLocale): LdcAmePickerOption[] {
	const intlLocale = locale === "zh" ? "zh-Hant" : "en-US";
	const formatter = new Intl.DateTimeFormat(intlLocale, { month: "long" });
	return Array.from({ length: 12 }, (_, index) => {
		const month = index + 1;
		return {
			value: String(month),
			label: formatter.format(new Date(2000, index, 1)),
		};
	});
}

export function gregorianDayOptions(year: number, month: number): LdcAmePickerOption[] {
	const clamped = clampGregorianParts({ year, month, day: 1 });
	const max = daysInGregorianMonth(clamped.year, clamped.month);
	return Array.from({ length: max }, (_, index) => {
		const day = index + 1;
		return { value: String(day), label: String(day) };
	});
}

export function lunarYearOptions(selectedYear?: number): LdcAmePickerOption[] {
	return yearOptions(LUNAR_PUBLIC_YEAR_MIN, LUNAR_PUBLIC_YEAR_MAX, selectedYear);
}

export function lunarMonthOptions(
	year: number,
	locale: LdcAmeLocale,
): LdcAmePickerOption[] {
	const months = listLunarMonths(year) ?? listLunarMonths(LUNAR_PUBLIC_YEAR_MIN) ?? [];
	return months.map((ref) => ({
		value: lunarMonthValue(ref.month, ref.isLeapMonth),
		label:
			locale === "zh" ? formatLunarMonthZh(ref.month, ref.isLeapMonth) : formatLunarMonthOptionEn(ref),
	}));
}

export function lunarDayOptions(
	year: number,
	month: number,
	isLeapMonth: boolean,
	locale: LdcAmeLocale,
): LdcAmePickerOption[] {
	const clamped = clampLunarParts({ year, month, isLeapMonth, day: 1 });
	const months = listLunarMonths(clamped.year) ?? [];
	const ref =
		months.find(
			(item) => item.month === clamped.month && item.isLeapMonth === clamped.isLeapMonth,
		) ?? months[0];
	const max = ref?.days ?? 29;
	return Array.from({ length: max }, (_, index) => {
		const day = index + 1;
		return { value: String(day), label: lunarDayCellLabel(day, locale) };
	});
}

function fillSelect(select: HTMLSelectElement, options: LdcAmePickerOption[], value: string): void {
	const html = options
		.map(
			(option) =>
				`<option value="${option.value}">${option.label}</option>`,
		)
		.join("");
	if (select.innerHTML !== html) {
		select.innerHTML = html;
	}
	if (select.value !== value) {
		select.value = value;
	}
}

export function syncLdcAmeUi(
	toolRoot: HTMLElement,
	draft: LdcAmeDraft,
	locale: LdcAmeLocale,
): void {
	const mode: LdcAmeMode = draft.mode === "lunar" ? "lunar" : "gregorian";
	const gregorian = clampGregorianParts(draft.gregorian);
	const lunar = clampLunarParts(draft.lunar);
	toolRoot.setAttribute("data-ldcv2-ame", mode);

	const gregorianPanel = toolRoot.querySelector<HTMLElement>("[data-ldcv2-ame-gregorian]");
	const lunarPanel = toolRoot.querySelector<HTMLElement>("[data-ldcv2-ame-lunar]");
	if (gregorianPanel) gregorianPanel.hidden = mode !== "gregorian";
	if (lunarPanel) lunarPanel.hidden = mode !== "lunar";

	const gYear = toolRoot.querySelector<HTMLSelectElement>("[data-ldcv2-ame-g-year]");
	const gMonth = toolRoot.querySelector<HTMLSelectElement>("[data-ldcv2-ame-g-month]");
	const gDay = toolRoot.querySelector<HTMLSelectElement>("[data-ldcv2-ame-g-day]");
	if (gYear) fillSelect(gYear, gregorianYearOptions(gregorian.year), String(gregorian.year));
	if (gMonth) fillSelect(gMonth, gregorianMonthOptions(locale), String(gregorian.month));
	if (gDay) {
		fillSelect(gDay, gregorianDayOptions(gregorian.year, gregorian.month), String(gregorian.day));
	}

	const lYear = toolRoot.querySelector<HTMLSelectElement>("[data-ldcv2-ame-l-year]");
	const lMonth = toolRoot.querySelector<HTMLSelectElement>("[data-ldcv2-ame-l-month]");
	const lDay = toolRoot.querySelector<HTMLSelectElement>("[data-ldcv2-ame-l-day]");
	if (lYear) fillSelect(lYear, lunarYearOptions(lunar.year), String(lunar.year));
	if (lMonth) {
		fillSelect(
			lMonth,
			lunarMonthOptions(lunar.year, locale),
			lunarMonthValue(lunar.month, lunar.isLeapMonth),
		);
	}
	if (lDay) {
		fillSelect(
			lDay,
			lunarDayOptions(lunar.year, lunar.month, lunar.isLeapMonth, locale),
			String(lunar.day),
		);
	}
}

export function bindLdcAmeInteractions(
	toolRoot: HTMLElement,
	api: {
		getDraft: () => LdcAmeDraft;
		patchDraft: (partial: Partial<LdcAmeDraft>) => void;
		isOpen: () => boolean;
		locale: LdcAmeLocale;
	},
): () => void {
	const abort = new AbortController();
	const { signal } = abort;

	const replaceDraft = (next: LdcAmeDraft) => {
		api.patchDraft(next);
	};

	const onSwitch = (event: Event) => {
		const target = event.target;
		if (!(target instanceof Element)) return;
		const btn = target.closest<HTMLElement>("[data-ldcv2-ame-switch]");
		if (!btn || !api.isOpen()) return;
		event.preventDefault();
		const next = btn.getAttribute("data-ldcv2-ame-switch") === "lunar" ? "lunar" : "gregorian";
		replaceDraft(switchLdcAmeDraft(api.getDraft(), next));
	};

	const onPickerChange = (event: Event) => {
		if (!api.isOpen()) return;
		const target = event.target;
		if (!(target instanceof HTMLSelectElement)) return;
		const draft = api.getDraft();

		if (target.matches("[data-ldcv2-ame-g-year]")) {
			replaceDraft(applyLdcAmeGregorianChange(draft, { year: Number(target.value) }));
			return;
		}
		if (target.matches("[data-ldcv2-ame-g-month]")) {
			replaceDraft(applyLdcAmeGregorianChange(draft, { month: Number(target.value) }));
			return;
		}
		if (target.matches("[data-ldcv2-ame-g-day]")) {
			replaceDraft(applyLdcAmeGregorianChange(draft, { day: Number(target.value) }));
			return;
		}
		if (target.matches("[data-ldcv2-ame-l-year]")) {
			replaceDraft(applyLdcAmeLunarChange(draft, { year: Number(target.value) }));
			return;
		}
		if (target.matches("[data-ldcv2-ame-l-month]")) {
			const parsed = parseLunarMonthValue(target.value);
			if (!parsed) return;
			replaceDraft(
				applyLdcAmeLunarChange(draft, {
					month: parsed.month,
					isLeapMonth: parsed.isLeapMonth,
				}),
			);
			return;
		}
		if (target.matches("[data-ldcv2-ame-l-day]")) {
			replaceDraft(applyLdcAmeLunarChange(draft, { day: Number(target.value) }));
		}
	};

	toolRoot.addEventListener("click", onSwitch, { signal });
	toolRoot.addEventListener("change", onPickerChange, { signal });

	return () => abort.abort();
}
