# bysquare

![version][version]
![build][build]

Simple JavaScript library to encode and decode "PAY by square" string.

**What is `PAY by square`?**

It's a national standard for QR code payments that was adopted by the Slovak
Banking Association in 2013. It is incorporated into a variety of invoices,
reminders and other payment regulations.

**Can I generate an image?**

This library doesn't have a specific opinion and how the QR code string is
transformed into images depends on how you implement it. See
[examples](./docs/examples/).

## Install

**NOTE**: This package is native [ESM][mozzila-esm] and no longer provides a
CommonJS export. If your project uses CommonJS, you will have to convert to ESM
or use the dynamic [`import()`][mozzila-import] function.

**npm registry**

```sh
npm install bysquare
```

**Browser**

```html
<script type="module">
	import { encode, decode } from "https://esm.sh/bysquare@2.7.1/";
</script>
```

**Deno** `v1.28+` using npm prefix

```ts
import { encode, decode } from "npm:bysquare@2.7.1";
```

**CLI** (Node.JS `v18`+)

```sh
npm install --global bysquare
```

# How it works

## Encoding sequence

![logic](./docs/uml/logic.svg)

# API

```ts
encode(model: DataModel, options?: Options): string
decode(qr: string): DataModel
detect(qr: string): Boolean
```

# Usage

## Encode

```ts
import { CurrencyCode, DataModel, encode, PaymentOptions } from "bysquare";

// string ready to be encoded to QR
const qrString = encode({
	invoiceId: "random-id",
	payments: [
		{
			type: PaymentOptions.PaymentOrder,
			amount: 100.0,
			bankAccounts: [
				{
					iban: "SK9611000000002918599669",
				},
			],
			currencyCode: CurrencyCode.EUR,
			variableSymbol: "123",
		},
	],
});
```

## Decode

```ts
import { decode } from "bysquare";

const model = decode(
	"0405QH8090IFU27IV0J6HGGLIOTIBVHNQQJQ6LAVGNBT363HR13JC6CB54HSI0KH9FCRASHNQBSKAQD2LJ4AU400UVKDNDPFRKLOBEVVVU0QJ000"
);

// {
// 	invoiceId: "random-id",
// 	payments: [
// 		{
// 			type: 1,
// 			amount: 100.0,
// 			bankAccounts: [
// 				{ iban: "SK9611000000002918599669" },
// 			],
// 			currencyCode: "EUR",
// 			variableSymbol: "123",
// 		}
// 	]
// }
//
```

# CLI

## Encode

Encode JSON data from files and print the corresponding QR code. The file
argument should be a path to a JSON file.

```sh
npx bysquare --encode <file1> <file2> <fileN>
```

## Decode

Decode the specified QR code string and print the corresponding JSON data. The
qrstring argument should be a valid QR code string.

```sh
npx bysquare --decode <qrstring>
```

## Related

-   <https://bysquare.com/>
-   <https://devel.cz/otazka/qr-kod-pay-by-square>
-   <https://github.com/matusf/pay-by-square>
-   <https://www.bsqr.co/schema/>
-   <https://www.sbaonline.sk/wp-content/uploads/2020/03/pay-by-square-specifications-1_1_0.pdf>
-   <https://www.vutbr.cz/studenti/zav-prace/detail/78439>

[build]: https://img.shields.io/github/actions/workflow/status/xseman/bysquare/tests.yml
[version]: https://img.shields.io/npm/v/bysquare
[mozzila-esm]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
[mozzila-import]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import
