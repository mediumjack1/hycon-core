
import * as fs from "fs"
import { getLogger } from "log4js"
import * as proto from "../serialization/proto"
import conf = require("../settings")
import { GenesisBlockHeader, setGenesisBlockHeader } from "./genesisHeader"
import { GenesisSignedTx } from "./txGenesisSigned"

const logger = getLogger("GenesisBlock")

// TODO: Clean up this interface?
export class GenesisBlock implements proto.IBlock {
    public static loadFromFile(path: string = conf.dataGenesis) {
        try {
            const file = fs.readFileSync(path)
            return GenesisBlock.decode(file)
        } catch (e) {
            logger.error("Genesis constructor fail : " + e)
        }
    }
    public static decode(data: Uint8Array): GenesisBlock {
        const block = proto.Block.decode(data)
        return new GenesisBlock(block)
    }
    public header: GenesisBlockHeader
    public txs: GenesisSignedTx[]

    constructor(block: proto.IBlock) {
        this.set(block)
    }

    public set(block: proto.IBlock): void {
        if (block.txs === undefined) { throw (new Error("Block Txs are missing")) }
        if (block.header === undefined) { throw (new Error("Block Header is missing in GenesisBlock")) }

        this.txs = []
        for (const tx of block.txs) {
            this.txs.push(new GenesisSignedTx(tx))
        }
        if (this.header === undefined) {
            this.header = setGenesisBlockHeader(block.header)
        } else {
            this.header.set(block.header)
        }
    }

    public encode(): Uint8Array {
        return proto.Block.encode(this).finish()
    }
}
