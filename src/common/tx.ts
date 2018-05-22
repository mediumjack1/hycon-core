import { getLogger } from "log4js"
import * as Long from "long"
import { Address } from "../common/address"
import { PublicKey } from "../common/publicKey"
import * as proto from "../serialization/proto"
import { hyconfromString } from "../util/commonUtil"
import { Hash } from "../util/hash"

const logger = getLogger("Tx")

export class Tx implements proto.ITx {
    public from: Address
    public to: Address
    public amount: Long
    public fee: Long
    public nonce: number

    constructor(tx?: proto.ITx) {
        if (tx) { this.set(tx) }
    }

    public set(tx: proto.ITx) {
        if (tx.from === undefined) { throw (new Error("from address not defined in input")) }
        if (tx.to === undefined) { throw (new Error("to address not defined in input")) }
        if (tx.amount === undefined) { throw (new Error("amount not defined in input")) }
        if (tx.fee === undefined) { throw (new Error("fee not defined in input")) }
        if (tx.nonce === undefined) { throw (new Error("nonce not defined in input")) }

        this.from = new Address(tx.from)
        this.to = new Address(tx.to)
        this.amount = tx.amount instanceof Long ? tx.amount : Long.fromNumber(tx.amount, true)
        this.fee = tx.fee instanceof Long ? tx.fee : Long.fromNumber(tx.fee, true)
        if (!this.amount.unsigned || !this.fee.unsigned) { logger.fatal(`Protobuf problem with Tx amount|fee `) }
        this.nonce = tx.nonce
    }

    public equals(tx: Tx): boolean {
        if (!this.to.equals(tx.to)) { return false }
        if (!this.from.equals(tx.from)) { return false }
        if (this.amount !== tx.amount) { return false }
        if (this.fee !== tx.fee) { return false }
        if (this.nonce !== tx.nonce) { return false }
        return true
    }

    public encode(): Uint8Array {
        return proto.Tx.encode(this).finish()
    }
}
