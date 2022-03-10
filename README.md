# bysquare

![build][build] ![build][license] ![build][version]

<!-- Dependency free simple  -->

Simple `Node.js` library to generate "PAY by square" `QR` string.

**What is `PAY by square`?**

It's a national standard for payment QR codes adopted by Slovak Banking
Association in 2013. It is part of a large number of invoices, reminders and
other payment regulations.

**Can I generate an image?**

This library is un-opinionated. Image generation from qr-code string depends on
your implementation. See [examples](examples).

## Install

Node.js

```sh
npm install bysquare
```

CLI, global

```sh
npm install --global bysquare
```

## API

### `function generate(model: Model): Promise<string>`

**Example (TypeScript)**

```typescript
import { generate, Model } from "bysquare";

const model: Model = {
    IBAN: "SK9611000000002918599669",
    Amount: 100.0,
    CurrencyCode: "EUR",
    VariableSymbol: "123",
    Payments: 1,
    PaymentOptions: 1,
    BankAccounts: 1,
};

generate(model).then((qrString) => {
    // your logic...
});
```

### `function parse(qrString: string): Promise<Model>`

**Example (TypeScript)**

```typescript
import { parse } from "bysquare";

const generated = "0004G0005ES17OQ09C98Q7ME34TCR3V71LVKD2AE6EGHKR82DKS5NBJ3331VUFQIV0JGMR743UJCKSAKEM9QGVVVOIVH000";

parse(generated).then((model) => {
    console.log(model);
    // {
    //     IBAN: 'SK9611000000002918599669',
    //     Amount: 100.0,
    //     CurrencyCode: "EUR",
    //     VariableSymbol: "123",
    //     Payments: 1,
    //     PaymentOptions: 1,
    //     BankAccounts: 1,
    // };
});
```

### CLI

You can use json file with valid model to generate qr-string.

**Example**

```sh
# example.json
# {
#     "IBAN": "SK9611000000002918599669",
#     "Amount": 100.0,
#     "CurrencyCode": "EUR",
#     "VariableSymbol": "123",
#     "Payments": 1,
#     "PaymentOptions": 1,
#     "BankAccounts": 1
# }

> npx bysquare ./example.json
> 0004G0005ES17OQ09C98Q7ME34TCR3V71LVKD2AE6EGHKR82DKS5NBJ3331VUFQIV0JGMR743UJCKSAKEM9QGVVVOIVH000
```

You can also use stdin.

**Example**

```sh
> echo '
    {
        "IBAN": "SK9611000000002918599669",
        "Amount": 100.0,
        "CurrencyCode": "EUR",
        "VariableSymbol": "123",
        "Payments": 1,
        "PaymentOptions": 1,
        "BankAccounts": 1
    }' \
| bysquare
> 0004G0005ES17OQ09C98Q7ME34TCR3V71LVKD2AE6EGHKR82DKS5NBJ3331VUFQIV0JGMR743UJCKSAKEM9QGVVVOIVH000
```

## Model

| Option                           | Type     | Required |
| -------------------------------- | -------- | -------- |
| InvoiceID                        | `string` | no       |
| Payments                         | `number` | yes      |
| PaymentOptions                   | `number` | yes      |
| Amount                           | `number` | no       |
| CurrencyCode                     | `string` | yes      |
| PaymentDueDate                   | `string` | no       |
| VariableSymbol                   | `string` | no       |
| ConstantSymbol                   | `string` | no       |
| SpecificSymbol                   | `string` | no       |
| OriginatorsReferenceInformation  | `string` | no       |
| PaymentNote                      | `string` | no       |
| BankAccounts                     | `number` | yes      |
| IBAN                             | `string` | yes      |
| BIC                              | `string` | no       |
| StandingOrderExt                 | `number` | no       |
| Day                              | `number` | no       |
| Month                            | `number` | no       |
| Periodicity                      | `string` | no       |
| LastDate                         | `string` | no       |
| LastDate                         | `string` | no       |
| DirectDebitExt                   | `number` | no       |
| DirectDebitScheme                | `number` | no       |
| DirectDebitType                  | `number` | no       |
| VariableSymbol_                  | `string` | no       |
| SpecificSymbol_                  | `string` | no       |
| OriginatorsReferenceInformation_ | `string` | no       |
| MandateID                        | `string` | no       |
| CreditorID                       | `string` | no       |
| ContractID                       | `string` | no       |
| MaxAmount                        | `number` | no       |
| ValidTillDate                    | `string` | no       |
| BeneficiaryName                  | `string` | no       |
| BeneficiaryAddressLine1          | `string` | no       |
| BeneficiaryAddressLine2          | `string` | no       |

## How it works

![diagram](./uml/logic.png)

## Resources

- <https://bysquare.com/>
- <https://devel.cz/otazka/qr-kod-pay-by-square>
- <https://github.com/matusf/pay-by-square>
- <https://www.sbaonline.sk/wp-content/uploads/2020/03/pay-by-square-specifications-1_1_0.pdf>
- <https://www.vutbr.cz/studenti/zav-prace/detail/78439>

<!-- Links -->

[build]: https://img.shields.io/github/workflow/status/xseman/bysquare/tests
[version]: https://img.shields.io/npm/v/bysquare
[license]: https://img.shields.io/github/license/xseman/bysquare

<!--
Versioning
----------

- Stash unfinished work
- Run the `preversion` script
- Bump version in `package.json` as requested (patch, minor, major, etc)
- Build app
- Run the `version` script
- Commit and tag
- Run the `postversion` script
- Checkout to master
- Push commits and tag, git push, git push --tags
- Publish to npm, npm publish
-->
