/**
 * ResultSummary shared controller — SSOT for digit buckets and rs:update handling.
 * content="numeric" | "textual"；省略 content 視為 numeric。
 */

export type RsDigits = "1-2" | "3" | "4" | "5" | "6+";
export type RsLayout = "desktop" | "portrait" | "landscape";
export type RsVariant = "standard" | "spacious";
export type RsContent = "numeric" | "textual";

export interface RsValueField {
	value: number;
	displayValue?: string;
	label?: string;
	ariaLabel?: string;
}

export interface RsSecondaryField extends RsValueField {
	key: string;
}

export interface RsTextualPrimary {
	text: string;
	ariaLabel?: string;
}

/** Numeric update；content 可省略（視為 numeric）。 */
export interface RsNumericUpdateDetail {
	content?: "numeric";
	primary: RsValueField;
	secondary: [RsSecondaryField, RsSecondaryField];
}

/** Textual update；content 必須為 textual。 */
export interface RsTextualUpdateDetail {
	content: "textual";
	primary: RsTextualPrimary;
	weekday?: string | null;
	support?: string | null;
}

export type RsUpdateDetail = RsNumericUpdateDetail | RsTextualUpdateDetail;

export const RS_UPDATE_EVENT = "rs:update";

const boundRoots = new WeakSet<HTMLElement>();
const VALID_DIGITS = new Set<RsDigits>(["1-2", "3", "4", "5", "6+"]);

function isDomElement(node: unknown): node is HTMLElement {
	return (
		typeof node === "object" &&
		node !== null &&
		"addEventListener" in node &&
		typeof (node as HTMLElement).addEventListener === "function" &&
		"setAttribute" in node
	);
}

/** 讀取 root content；缺省或非法非 textual 時視為 numeric。 */
export function readRsContent(root: HTMLElement): RsContent {
	return root.getAttribute("data-rs-content") === "textual" ? "textual" : "numeric";
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

export function isValidRsDigits(value: string | null): value is RsDigits {
	return value !== null && VALID_DIGITS.has(value as RsDigits);
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

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function readPayloadContent(detail: Record<string, unknown>): RsContent | "invalid" {
	if (!("content" in detail) || detail.content === undefined) {
		return "numeric";
	}

	if (detail.content === "numeric") {
		return "numeric";
	}

	if (detail.content === "textual") {
		return "textual";
	}

	return "invalid";
}

function isTextualPrimary(value: unknown): value is RsTextualPrimary {
	if (!isPlainObject(value)) {
		return false;
	}

	return typeof value.text === "string";
}

function optionalTextField(value: unknown): value is string | null | undefined {
	return value === undefined || value === null || typeof value === "string";
}

function validateNumericPayload(
	root: HTMLElement,
	payload: Record<string, unknown>,
): payload is RsNumericUpdateDetail {
	if (!isPlainObject(payload.primary)) {
		return false;
	}

	if (!Number.isFinite((payload.primary as RsValueField).value)) {
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
		if (!root.querySelector(`[data-rs-key="${(field as RsSecondaryField).key}"]`)) {
			return false;
		}
	}

	return true;
}

function validateTextualPayload(
	root: HTMLElement,
	payload: Record<string, unknown>,
): payload is RsTextualUpdateDetail {
	if ("secondary" in payload && payload.secondary !== undefined) {
		return false;
	}

	if (!isTextualPrimary(payload.primary)) {
		return false;
	}

	// 拒絕用 numeric finite value 假裝文字結果
	if ("value" in payload.primary && (payload.primary as { value?: unknown }).value !== undefined) {
		return false;
	}

	if (!optionalTextField(payload.weekday) || !optionalTextField(payload.support)) {
		return false;
	}

	if (!root.querySelector('[data-rs-value="primary"]')) {
		return false;
	}

	if (!root.querySelector("[data-rs-weekday]")) {
		return false;
	}

	if (!root.querySelector("[data-rs-support]")) {
		return false;
	}

	return true;
}

/** Invalid payload 整筆 reject；不部分更新。 */
export function validateRsUpdatePayload(
	root: HTMLElement,
	detail: unknown,
): detail is RsUpdateDetail {
	if (!isPlainObject(detail)) {
		return false;
	}

	const rootContent = readRsContent(root);
	const payloadContent = readPayloadContent(detail);

	if (payloadContent === "invalid") {
		return false;
	}

	if (payloadContent !== rootContent) {
		return false;
	}

	if (payloadContent === "textual") {
		return validateTextualPayload(root, detail);
	}

	return validateNumericPayload(root, detail);
}

function readLabelText(element: Element | null): string {
	return element?.textContent?.trim() ?? "";
}

function buildNumericStatusSummary(root: HTMLElement, detail: RsNumericUpdateDetail): string {
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

function buildTextualStatusSummary(detail: RsTextualUpdateDetail): string {
	const parts: string[] = [];
	const primarySpoken = detail.primary.ariaLabel?.trim() || detail.primary.text;
	parts.push(primarySpoken);

	const weekday = detail.weekday?.trim();
	if (weekday) {
		parts.push(weekday);
	}

	const support = detail.support?.trim();
	if (support) {
		parts.push(support);
	}

	return parts.join("; ");
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

function setOptionalTextSlot(el: HTMLElement | null, value: string | null | undefined): void {
	if (!el) {
		return;
	}

	const text = typeof value === "string" ? value.trim() : "";

	if (!text) {
		el.textContent = "";
		el.hidden = true;
		return;
	}

	el.textContent = text;
	el.hidden = false;
}

function applyNumericUpdate(root: HTMLElement, detail: RsNumericUpdateDetail): void {
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
		statusEl.textContent = buildNumericStatusSummary(root, detail);
	}
}

function applyTextualUpdate(root: HTMLElement, detail: RsTextualUpdateDetail): void {
	const primaryValue = root.querySelector('[data-rs-value="primary"]');

	if (primaryValue) {
		primaryValue.textContent = detail.primary.text;

		if (detail.primary.ariaLabel !== undefined) {
			(primaryValue as HTMLElement).setAttribute("aria-label", detail.primary.ariaLabel);
		} else {
			(primaryValue as HTMLElement).removeAttribute("aria-label");
		}
	}

	setOptionalTextSlot(
		root.querySelector<HTMLElement>("[data-rs-weekday]"),
		detail.weekday,
	);
	setOptionalTextSlot(
		root.querySelector<HTMLElement>("[data-rs-support]"),
		detail.support,
	);

	// Textual：不輸出／不更新 data-rs-digits
	root.removeAttribute("data-rs-digits");

	const statusEl = root.querySelector(".rs-status");

	if (statusEl) {
		statusEl.textContent = buildTextualStatusSummary(detail);
	}
}

function applyUpdate(root: HTMLElement, detail: RsUpdateDetail): void {
	if (readRsContent(root) === "textual") {
		applyTextualUpdate(root, detail as RsTextualUpdateDetail);
		return;
	}

	applyNumericUpdate(root, detail as RsNumericUpdateDetail);
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
	readRsContent,
	isValidRsDigits,
	RS_UPDATE_EVENT,
};
