import { getLogger } from "log4js"
import merkle = require("merkle-lib")
import * as proto from "../serialization/proto"
import { Hash } from "../util/hash"
import { Address } from "./address"
import { GenesisBlock } from "./blockGenesis"
import { AnyBlockHeader, BlockHeader } from "./blockHeader"
import { SignedTx } from "./txSigned"

const logger = getLogger("Block")

export type AnyBlock = (Block | GenesisBlock)

export class Block implements proto.IBlock {
    public static decode(data: Uint8Array): AnyBlock {
        const block = proto.Block.decode(data)
        if (block.header !== undefined) {
            if (block.header.previousHash === undefined || block.header.previousHash.length === 0) {
                return new GenesisBlock(block)
            }
        }
        return new Block(block)
    }

    public header: BlockHeader
    public txs: SignedTx[]

    constructor(block: proto.IBlock) {
        this.set(block)
    }

    public set(block: proto.IBlock): void {
        if (block.txs === undefined) { throw (new Error("Block Txs are missing")) }
        if (block.header === undefined) { throw (new Error("Block Header is missing in Block")) }

        this.txs = []
        for (const tx of block.txs) {
            this.txs.push(new SignedTx(tx))
        }

        if (this.header === undefined) {
            this.header = new BlockHeader(block.header)
        } else {
            this.header.set(block.header)
        }
    }

    public updateMerkleRoot(): void {
        this.header.merkleRoot = this.calculateMerkleRoot()
    }

    public encode(): Uint8Array {
        return proto.Block.encode(this).finish()
    }

    public calculateMerkleRoot(): Hash {
        const values: Uint8Array[] = []
        this.txs.forEach((tx) => {
            const hash = new Hash(tx)
            values.push(hash)
        })
        const outArr = merkle(values, Hash.hash)
        return new Hash(outArr[outArr.length - 1])
    }
}
