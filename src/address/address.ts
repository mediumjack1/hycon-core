import * as Base58 from 'base-58'
import * as proto from '../serialization/proto'
import { Hash } from '../utils/hash'

function checkSum(arr: Uint8Array): string {
    const hash = Hash.hash(arr)
    let str = Base58.encode(hash)
    str = str.slice(0, 4)
    return str
}

function toUint8Array(address: (string | Uint8Array)) {
    if (typeof address == 'string') {
        const check = address.slice(-4)
        address = address.slice(1, -4)
        const out: Uint8Array = Base58.decode(address)
        const expectedChecksum = checkSum(out)
        if (expectedChecksum != check) {
            throw new Error(`Address hash invalid checksum '${check}' epected '${expectedChecksum}'`)
        }
        return out
    }
    return address
}

export class Address extends Uint8Array {
    constructor(address: string | Uint8Array | number) {
        typeof address == 'number' ? super(address) : super(toUint8Array(address)) // Need to allow for super constructor for number due to extension of Uint8Array
    }

    public toString(): string {
        let str = ''
        try {
            str = Base58.encode(this)
            str += checkSum(this)
            str = 'H' + str
        } catch (err) {
            console.log(err)
        }

        return str
    }

    public equals(address: Address): boolean {
        if (this.length != address.length) { return false }
        for (let i = 0; i < address.length; i++) {
            if (this[i] != address[i]) {
                return false
            }
        }
        return true
    }

    public static decode(string: string): Address {
        string = string.slice(1, string.length - 4)
        return new Address(Base58.decode(string))
    }
}
