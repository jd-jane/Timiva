/**
 * ResultSummary shared controller — SSOT for digit buckets and rs:update handling.
 */

export type RsDigits = "1-2" | "3" | "4" | "5" | "6+";
export type RsLayout = "desktop" | "portrait" | "landscape";
export type RsVariant = "standard" | "spacious";

export interface RsValueField {
	value: number;
	displayValue?: string;
	label?: string;
	ariaLabel?: string;
}

export interface RsSecondaryField extends RsValueField {
	key: string;
}

export interface RsUpdateDetail {
	primary: RsValueField;
	secondary: [RsSecondaryField, RsSecondaryField];
}

export const RS_UPDATE_EVENT = "rs:update";

const boundRoots = new WeakSet<HTMLElement>();

function isDomElement(node: unknown): node is HTMLElement {
	return (
		typeof node === "object" &&
		node !== null &&
		"addEventListener" in node &&
		typeof (node as HTMLElement).addEventListener === "function" &&
		"setAttribute" in node
	);
}

/** 單一數值的有效位數；非 finite 回傳 null。 */
export function digitLength(value: number): number | null {
	if (!Number.isFinite(value)) {
		return null;
	}

	return String(Math.abs(Math.trunc(value))).length;
}

/** SSR 與 client 共用的 bucket 計算；僅使用 raw finite numbers。 */
export function computeRsDigits(values: readonly number[]): RsDigits {
	const lengths = values
		.map(digitLength)
		.filter((length): length is number => length !== null);

	if (lengths.length === 0) {
		return "1-2";
	}

	const maxDigits = Math.max(...lengths);

	if (maxDigits <= 2) {
		return "1-2";
	}

	if (maxDigits === 3) {
		return "3";
	}

	if (maxDigits === 4) {
		return "4";
	}

	if (maxDigits === 5) {
		return "5";
	}

	return "6+";
}

/** SSR／update 顯示文字；非 finite 顯示 em dash。 */
export function formatRsDisplayValue(value: number, displayValue?: string): string {
	if (displayValue !== undefined) {
		return displayValue;
	}

	if (!Number.isFinite(value)) {
		return "—";
	}

	return String(value);
}

function isSecondaryField(value: unknown): value is RsSecondaryField {
	if (!value || typeof value !== "object") {
		return false;
	}

	const field = value as RsSecondaryField;

	return typeof field.key === "string" && field.key.length > 0 && Number.isFinite(field.value);
}

/** Invalid payload 整筆 reject；不部分更新。 */
export function validateRsUpdatePayload(
	root: HTMLElement,
	detail: unknown,
): detail is RsUpdateDetail {
	if (!detail || typeof detail !== "object") {
		return false;
	}

	const payload = detail as RsUpdateDetail;

	if (!payload.primary || typeof payload.primary !== "object") {
		return false;
	}

	if (!Number.isFinite(payload.primary.value)) {
		return false;
	}

	if (!Array.isArray(payload.secondary) || payload.secondary.length !== 2) {
		return false;
	}

	if (!isSecondaryField(payload.secondary[0]) || !isSecondaryField(payload.secondary[1])) {
		return false;
	}

	if (payload.secondary[0].key === payload.secondary[1].key) {
		return false;
	}

	if (!root.querySelector('[data-rs-value="primary"]')) {
		return false;
	}

	for (const field of payload.secondary) {
		if (!root.querySelector(`[data-rs-key="${field.key}"]`)) {
			return false;
		}
	}

	return true;
}

function readLabelText(element: Element | null): string {
	return element?.textContent?.trim() ?? "";
}

function buildStatusSummary(root: HTMLElement, detail: RsUpdateDetail): string {
	const primaryLabel =
		detail.primary.label ??
		readLabelText(root.querySelector('[data-rs-label="primary"]'));

	const primaryValue = formatRsDisplayValue(detail.primary.value, detail.primary.displayValue);

	const secondaryParts = detail.secondary.map((field) => {
		const item = root.querySelector(`[data-rs-key="${field.key}"]`);
		const label = field.label ?? readLabelText(item?.querySelector("[data-rs-label]") ?? null);
		const value = formatRsDisplayValue(field.value, field.displayValue);
		return `${label}: ${value}`;
	});

	return `${primaryLabel}: ${primaryValue}; ${secondaryParts.join("; ")}`;
}

function applyFieldText(
	valueEl: Element | null,
	labelEl: Element | null,
	field: RsValueField,
): void {
	if (valueEl) {
		valueEl.textContent = formatRsDisplayValue(field.value, field.displayValue);
	}

	if (field.label !== undefined && labelEl) {
		labelEl.textContent = field.label;
	}

	if (field.ariaLabel !== undefined && valueEl && "setAttribute" in valueEl) {
		(valueEl as HTMLElement).setAttribute("aria-label", field.ariaLabel);
	}
}

function applyUpdate(root: HTMLElement, detail: RsUpdateDetail): void {
	applyFieldText(
		root.querySelector('[data-rs-value="primary"]'),
		root.querySelector('[data-rs-label="primary"]'),
		detail.primary,
	);

	for (const field of detail.secondary) {
		const item = root.querySelector(`[data-rs-key="${field.key}"]`);

		if (!item) {
			continue;
		}

		applyFieldText(
			item.querySelector("[data-rs-value]"),
			item.querySelector("[data-rs-label]"),
			field,
		);
	}

	const digits = computeRsDigits([
		detail.primary.value,
		detail.secondary[0].value,
		detail.secondary[1].value,
	]);

	root.setAttribute("data-rs-digits", digits);

	const statusEl = root.querySelector(".rs-status");

	if (statusEl) {
		statusEl.textContent = buildStatusSummary(root, detail);
	}
}

function handleRsUpdate(event: Event): void {
	if (!isDomElement(event.currentTarget)) {
		return;
	}

	update(event.currentTarget, (event as CustomEvent<RsUpdateDetail>).detail);
}

/** 綁定 root 上的 rs:update；可重複 init，同一 root 不重複綁定。 */
export function init(documentRoot: Document | HTMLElement = document): void {
	const roots = documentRoot.querySelectorAll("[data-result-summary]");

	for (const node of roots) {
		if (!isDomElement(node)) {
			continue;
		}

		if (boundRoots.has(node) || node.getAttribute("data-rs-controller-bound") === "true") {
			continue;
		}

		node.addEventListener(RS_UPDATE_EVENT, handleRsUpdate);
		node.setAttribute("data-rs-controller-bound", "true");
		boundRoots.add(node);
	}
}

/** 公開 API；invalid payload 整筆 no-op。 */
export function update(root: HTMLElement, detail: unknown): boolean {
	if (!validateRsUpdatePayload(root, detail)) {
		return false;
	}

	applyUpdate(root, detail);
	return true;
}

export const ResultSummaryController = {
	init,
	update,
	computeRsDigits,
	digitLength,
	validateRsUpdatePayload,
	RS_UPDATE_EVENT,
};
