declare module 'merkle-lib'
{
    type Concatable = Buffer | Uint8Array
    function merkle(values: Concatable[], hashFunction: (value: Concatable) => Concatable): Concatable[]

    export = merkle
}