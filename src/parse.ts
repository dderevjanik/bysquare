import * as lzma from "lzma1"
import { base32hex } from "rfc4648"

import {
	BankAccount,
	Beneficiary,
	CurrencyCodeEnum,
	DataModel,
	Day,
	Payment,
	PaymentOptions,
	Periodicity,
	Version
} from "./index.js"

function cleanEmptyProps(obj: any): void {
	Object.keys(obj).forEach((key) => {
		if (typeof obj[key] === "undefined") {
			delete obj[key]
		}
	})
}

/**
 * Generating by square Code
 *
 * @see 3.14.
 */
export function deserialize(qr: string): DataModel {
	const serialized = qr.split("\t")
	const invoiceId = serialized.shift()
	const output: DataModel = {
		invoiceId: invoiceId?.length ? invoiceId : undefined,
		payments: []
	}

	const paymentslen = Number(serialized.shift())

	for (let i = 0; i < paymentslen; i++) {
		const paymentOptions = serialized.shift()
		const ammount = serialized.shift()
		const currency = serialized.shift()
		const dueDate = serialized.shift()
		const variables = serialized.shift()
		const constants = serialized.shift()
		const specifics = serialized.shift()
		const originatorRefInfo = serialized.shift()
		const paymentNote = serialized.shift()

		let payment: Payment = {
			bankAccounts: [],
			type: Number(paymentOptions) as PaymentOptions,
			currencyCode: currency as keyof typeof CurrencyCodeEnum,
			amount: ammount?.length
				? Number(ammount)
				: undefined,
			paymentDueDate: dueDate?.length
				? dueDate
				: undefined,
			variableSymbol: variables?.length
				? variables
				: undefined,
			constantSymbol: constants?.length
				? constants
				: undefined,
			specificSymbol: specifics?.length
				? specifics
				: undefined,
			originatorRefInfo: originatorRefInfo?.length
				? originatorRefInfo
				: undefined,
			paymentNote: paymentNote?.length
				? paymentNote
				: undefined
		}

		const accountslen = Number(serialized.shift())
		for (let j = 0; j < accountslen; j++) {
			const iban = serialized.shift()
			if (iban === undefined || iban.length === 0) {
				throw new Error("Missing IBAN")
			}

			const bic = serialized.shift()
			const account = {
				iban: iban,
				bic: bic?.length
					? bic
					: undefined
			} satisfies BankAccount
			cleanEmptyProps(account)
			payment.bankAccounts.push(account)
		}

		serialized.shift() // StandingOrderExt
		serialized.shift() // DirectDebitExt

		// narrowing payment type
		switch (payment.type) {
			case PaymentOptions.PaymentOrder:
				break

			case PaymentOptions.StandingOrder:
				payment = {
					...payment,
					day: Number(serialized.shift()) as Day,
					month: Number(serialized.shift()),
					periodicity: serialized.shift() as Periodicity,
					lastDate: serialized.shift()
				}
				break

			case PaymentOptions.DirectDebit:
				payment = {
					...payment,
					directDebitScheme: Number(serialized.shift()),
					directDebitType: Number(serialized.shift()),
					mandateId: serialized.shift(),
					creditorId: serialized.shift(),
					contractId: serialized.shift(),
					maxAmount: Number(serialized.shift()),
					validTillDate: serialized.shift()
				}
				break

			default:
				break
		}
		cleanEmptyProps(payment)
		output.payments.push(payment)
	}

	for (let i = 0; i < paymentslen; i++) {
		const name = serialized.shift()
		const addressLine1 = serialized.shift()
		const addressLine2 = serialized.shift()

		if (Boolean(name) || Boolean(addressLine1) || Boolean(addressLine2)) {
			const beneficiary = {
				name: name?.length
					? name
					: undefined,
				street: addressLine1?.length
					? addressLine1
					: undefined,
				city: addressLine2?.length
					? addressLine2
					: undefined
			} satisfies Beneficiary

			cleanEmptyProps(beneficiary)
			output.payments[i].beneficiary = beneficiary
		}
	}

	return output
}

type Properties = {
	lc: number
	lp: number
	pb: number
}

/**
 * LZMA compression properties from the byte
 *
 * @param props 1-byte size
 */
function LzmaPropertiesDecoder(props: Uint8Array): Properties {
	const byte = props[0]
	return {
		lc: byte >> 5,
		lp: byte >> 2 & 0b0111,
		pb: byte & 0b0011
	}
}

function calcLzmaDictionarySize(props: Properties): Uint8Array {
	const dictionarySize = new ArrayBuffer(4)
	new DataView(dictionarySize).setUint32(
		0,
		Math.pow(2, props.pb + props.lp)
	)

	return new Uint8Array(dictionarySize)
}

/**
 * The function uses bit-shifting and masking to convert the first two bytes of
 * the input header array into four nibbles representing the bysquare header
 * values.
 *
 * @param header 2-bytes sie
 */
function bysquareHeaderDecoder(header: Uint8Array) {
	const bytes = (header[0] << 8) | header[1]
	const bysquareType = bytes >> 12
	const version = (bytes >> 8) & 0b1111
	const documentType = (bytes >> 4) & 0b1111
	const reserved = bytes & 0b1111

	return {
		bysquareType,
		version,
		documentType,
		reserved
	}
}

export class DecodeError extends Error {
	override name = "DecodeError"
	constructor(public cause: Error, msg?: string) {
		super(msg)
	}
}

/**
 * Decoding client data from QR Code 2005 symbol
 *
 * @see 3.16.
 */
export function parse(qr: string): DataModel {
	try {
		var bytes = base32hex.parse(qr, {
			loose: true
		})
	} catch (error) {
		throw new DecodeError(
			error,
			"Unable to decode QR string base32hex encoding"
		)
	}

	const bysquareHeader = bytes.slice(0, 2)
	const { version } = bysquareHeaderDecoder(bysquareHeader)
	if ((version > Version["1.1.0"])) {
		throw new Error("Unsupported Bysquare version")
	}

	/**
	 * The process of decompressing data requires the addition of an LZMA header
	 * to the compressed data. This header is necessary for the decompression
	 * algorithm to properly interpret and extract the original uncompressed
	 * data. Bysquare only store properties
	 *
	 * <----------------------- 13-bytes ----------------------->
	 *
	 * +------------+----+----+----+----+--+--+--+--+--+--+--+--+
	 * | Properties |  Dictionary Size  |   Uncompressed Size   |
	 * +------------+----+----+----+----+--+--+--+--+--+--+--+--+
	 */
	const lzmaProperties: Uint8Array = bytes.slice(2, 3)
	const decodedProps = LzmaPropertiesDecoder(lzmaProperties)
	const dictSize = calcLzmaDictionarySize(decodedProps)

	const header = new Uint8Array([
		lzmaProperties[0],
		...dictSize,
		/** Uncompressed size, this value indicates that size is unknown */
		...[0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]
	])

	const payload = bytes.slice(4)
	const body = new Uint8Array([
		...header,
		...payload
	])

	try {
		var decompressed = new Uint8Array(lzma.decompress(body))
	} catch (error) {
		throw new DecodeError(error, "LZMA decompression failed")
	}

	const dataLength = bytes.slice(3, 4)
	if (dataLength[0] !== decompressed.length) {
		throw new Error(
			"The length of the data after decompression is not as expected."
		)
	}

	const _checksum = decompressed.slice(0, 4)
	const decompressedBody = decompressed.slice(4)
	const decoded = new TextDecoder("utf-8").decode(decompressedBody)

	return deserialize(decoded)
}

/**
 * Detect if qr string contains bysquare header.
 *
 * Bysquare header does not have too much information, therefore it is
 * not very reliable, there is room for improvement for the future.
 */
export function detect(qr: string): boolean {
	try {
		var parsed = base32hex.parse(qr, {
			loose: true
		})
	} catch {
		throw new Error(
			"Invalid data, Unable to decode base32hex QR string"
		)
	}

	if (parsed.byteLength < 2) {
		return false
	}

	const bysquareHeader = parsed.subarray(0, 2)
	const {
		bysquareType,
		version,
		documentType,
		reserved
	} = bysquareHeaderDecoder(bysquareHeader)

	const isValid = [bysquareType, version, documentType, reserved]
		.every((nibble, index) => {
			if (index === 1) {
				return nibble <= Version["1.1.0"]
			}

			return 0x00 <= nibble && nibble <= 0x0F
		})

	return isValid
}
