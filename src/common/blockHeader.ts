import blake2b = require("blake2b")
import * as Long from "long"
import * as proto from "../serialization/proto"
import { Hash } from "../util/hash"
import { Address } from "./address"
import { BaseBlockHeader, GenesisBlockHeader } from "./genesisHeader"

export type AnyBlockHeader = (BlockHeader | GenesisBlockHeader)

export class BlockHeader extends BaseBlockHeader {
    public previousHash: Hash[] = []
    public nonce: Long
    public miner: Address

    constructor(header: proto.IBlockHeader) {
        super()
        this.set(header)
    }

    public set(header: proto.IBlockHeader): void {
        super.set(header)
        if (header.previousHash === undefined) { throw new Error("Header missing previous hash") }
        if (header.nonce === undefined) { throw new Error("Header missing nonce") }
        if (header.difficulty === undefined || header.difficulty == null || header.difficulty < 0) {
            throw new Error("Header missing difficulty")
        }
        if (header.miner === undefined) {
            this.miner = new Address(new Uint8Array(20))
        } else {
            this.miner = new Address(header.miner)
        }

        for (const prev of header.previousHash) {
            this.previousHash.push(new Hash(prev))
        }

        this.nonce = header.nonce instanceof Long ? header.nonce : Long.fromNumber(header.nonce, true)
    }

    public preHash(): Uint8Array {
        const hashExcludeNonce: Uint8Array = blake2b(64).update(this.prehashEncode()).digest()
        return hashExcludeNonce
    }

    private prehashEncode(): Uint8Array {
        const header = Object.assign({}, this)
        delete header.nonce
        return proto.BlockHeader.encode(header).finish()
    }
}
